/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
  * @brief          : Main program body
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2026 STMicroelectronics.
  * All rights reserved.
  *
  * This software is licensed under terms that can be found in the LICENSE file
  * in the root directory of this software component.
  * If no LICENSE file comes with this software, it is provided AS-IS.
  *
  ******************************************************************************
  */
/* USER CODE END Header */
/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include "usb_device.h"
#include "gpio.h"

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */

/* USER CODE END Includes */

/* Private typedef -----------------------------------------------------------*/
/* USER CODE BEGIN PTD */

/* USER CODE END PTD */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */

/* USER CODE END PD */

/* Private macro -------------------------------------------------------------*/
/* USER CODE BEGIN PM */

/* USER CODE END PM */

/* Private variables ---------------------------------------------------------*/

/* USER CODE BEGIN PV */
#include "usbd_cdc_if.h" // USB üzerinden bilgisayara veri basabilmek için gereken kütüphane

// 4 adet enkoder için anlık konum sayaçları (0-79 arası sınırlandırılacak)
volatile int32_t enc_counts[4] = {0, 0, 0, 0};

// Enkoderların bir önceki lojik durum geçmişi: (Kanal_A << 1) | Kanal_B
volatile uint8_t enc_state_history[4] = {0, 0, 0, 0};

// USB üzerinden Python'dan gelen verileri yakalayacağımız buffer (usbd_cdc_if.c içinde tanımlıdır)
extern uint8_t UserRxBufferFS[APP_RX_DATA_SIZE];
/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
/* USER CODE BEGIN PFP */

/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */

/* USER CODE END 0 */

/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{

  /* USER CODE BEGIN 1 */

  /* USER CODE END 1 */

  /* MCU Configuration--------------------------------------------------------*/

  /* Reset of all peripherals, Initializes the Flash interface and the Systick. */
  HAL_Init();

  /* USER CODE BEGIN Init */

  /* USER CODE END Init */

  /* Configure the system clock */
  SystemClock_Config();

  /* USER CODE BEGIN SysInit */

  /* USER CODE END SysInit */

  /* Initialize all configured peripherals */
  MX_GPIO_Init();
  MX_USB_DEVICE_Init();
  /* USER CODE BEGIN 2 */

  /* USER CODE END 2 */

  /* Infinite loop */
/* USER CODE BEGIN WHILE */
  while (1)
  {
      // 1. Fiziksel Reset Butonu Kontrolü ve Debounce Güvenliği (PB1)
      if (HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_1) == GPIO_PIN_RESET) { 
          HAL_Delay(50); // Debounce gecikmesi (Gürültüyü engelle)
          
          // Sayaçları sıfırla
          enc_counts[0] = 0; enc_counts[1] = 0; enc_counts[2] = 0; enc_counts[3] = 0;
          
          // Çarkların anlık fiziksel lojik durumlarını (ok yönü orijini) hafızaya kilitle
          enc_state_history[0] = (HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_0) << 1) | HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_1);
          enc_state_history[1] = (HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_2) << 1) | HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_3);
          enc_state_history[2] = (HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_6) << 1) | HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_7);
          enc_state_history[3] = (HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_8) << 1) | HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_9);

          HAL_GPIO_WritePin(GPIOB, GPIO_PIN_0, GPIO_PIN_RESET); // Kilidi kapat
          
          // Buton bırakılana kadar burada bekle (Sürekli tetiklenmeyi engeller)
          // Timeout: 1 saniye (Buton takıldığında sistemin blok olmasını engelle)
          uint32_t button_timeout = HAL_GetTick() + 1000;
          while(HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_1) == GPIO_PIN_RESET && HAL_GetTick() < button_timeout);
      }

      // 2. Python'dan Gelen USB Komutlarının Güvenli (Race Condition Korumalı) Kontrolü
      // Ana buffer'ın anlık kopyasını alıyoruz (Thread-Safe yaklaşım)
      char rx_copy[APP_RX_DATA_SIZE];
      __disable_irq(); // Kopyalama esnasında USB kesmesini milisaniyeliğine durdur
      strncpy(rx_copy, (char*)UserRxBufferFS, APP_RX_DATA_SIZE);
      memset(UserRxBufferFS, 0, APP_RX_DATA_SIZE); // Orijinal buffer'ı hemen güvenle temizle
      __enable_irq();  // Kesmeleri geri aç

      // İşlemleri kopyalanan güvenli veri üzerinden yürüt
      if (strstr(rx_copy, "OPEN") != NULL) {
          HAL_GPIO_WritePin(GPIOB, GPIO_PIN_0, GPIO_PIN_SET); // Kilidi aç
      }
      else if (strstr(rx_copy, "CLOSE") != NULL) {
          HAL_GPIO_WritePin(GPIOB, GPIO_PIN_0, GPIO_PIN_RESET); // Kilidi kapat
      }
      else if (strstr(rx_copy, "RESET") != NULL) {
          // Python'dan gelen yazılımsal sıfırlama emri
          enc_counts[0] = 0; enc_counts[1] = 0; enc_counts[2] = 0; enc_counts[3] = 0;
      }

      // 3. Atomik Veri Okuma (Kesme esnasında değerlerin değişmesine karşı güvence)
      int32_t s1 = enc_counts[0];
      int32_t s2 = enc_counts[1];
      int32_t s3 = enc_counts[2];
      int32_t s4 = enc_counts[3];

      // 4. Güvenli Buffer Paketleme (Buffer Overflow Koruması)
      char msg[64];
      // sprintf yerine snprintf kullanarak maksimum 64 bayt sınırını donanımsal olarak koruyoruz
      int len = snprintf(msg, sizeof(msg), "%ld,%ld,%ld,%ld\n", s1, s2, s3, s4);
      
      if (len > 0 && len < sizeof(msg)) {
          CDC_Transmit_FS((uint8_t*)msg, len); // USB hattına veriyi bas
      }

      // 5. Ekran Yenileme Payı
      HAL_Delay(16); // ~60 Hz
  }
    /* USER CODE END WHILE */

    /* USER CODE BEGIN 3 */
  }
  /* USER CODE END 3 */

/**
  * @brief System Clock Configuration
  * @retval None
  */
void SystemClock_Config(void)
{
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};

  /** Configure the main internal regulator output voltage
  */
  __HAL_RCC_PWR_CLK_ENABLE();
  __HAL_PWR_VOLTAGESCALING_CONFIG(PWR_REGULATOR_VOLTAGE_SCALE1);

  /** Initializes the RCC Oscillators according to the specified parameters
  * in the RCC_OscInitTypeDef structure.
  */
  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSE;
  RCC_OscInitStruct.HSEState = RCC_HSE_ON;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;
  RCC_OscInitStruct.PLL.PLLM = 25;
  RCC_OscInitStruct.PLL.PLLN = 192;
  RCC_OscInitStruct.PLL.PLLP = RCC_PLLP_DIV2;
  RCC_OscInitStruct.PLL.PLLQ = 4;
  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  /** Initializes the CPU, AHB and APB buses clocks
  */
  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                              |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV2;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_3) != HAL_OK)
  {
    Error_Handler();
  }
}

/* USER CODE BEGIN 4 */
void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin)
{
    uint8_t enc_index = 0;
    uint8_t current_A = 0;
    uint8_t current_B = 0;

    // 1. ADIM: Hangi pinden kesme geldiğini ve o anki lojik durumu (0 veya 1) tespit ediyoruz
    if (GPIO_Pin == GPIO_PIN_0 || GPIO_Pin == GPIO_PIN_1) {
        enc_index = 0; // Enkoder 1 (PA0 - PA1)
        current_A = HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_0);
        current_B = HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_1);
    }
    else if (GPIO_Pin == GPIO_PIN_2 || GPIO_Pin == GPIO_PIN_3) {
        enc_index = 1; // Enkoder 2 (PA2 - PA3) - Sıfır çakışmalı yeni yerimiz!
        current_A = HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_2);
        current_B = HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_3);
    }
    else if (GPIO_Pin == GPIO_PIN_6 || GPIO_Pin == GPIO_PIN_7) {
        enc_index = 2; // Enkoder 3 (PB6 - PB7) - Portu GPIOB olarak düzelttik!
        current_A = HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_6);
        current_B = HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_7);
    }
    else if (GPIO_Pin == GPIO_PIN_8 || GPIO_Pin == GPIO_PIN_9) {
        enc_index = 3; // Enkoder 4 (PA8 - PA9)
        current_A = HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_8);
        current_B = HAL_GPIO_ReadPin(GPIOA, GPIO_PIN_9);
    }
    else {
        return; // Bizim enkoderlar dışından bir kesme geldiyse fonksiyondan çık
    }

    // 2. ADIM: İki pindeki lojik durumu tek bir 2-bitlik sayıda birleştiriyoruz (Örn: A=1, B=0 ise durum 10 yani 2)
    uint8_t current_state = (current_A << 1) | current_B;
    uint8_t old_state = enc_state_history[enc_index];

    // Eğer donanımsal bir durum değişimi varsa lojiği işlet
    if (old_state != current_state) {
        // 3. ADIM: Gray kodu durum geçiş matrisine göre yön tayini (00->01, 01->11, 11->10, 10->00 İleri yön)
        if ((old_state == 0 && current_state == 1) || 
            (old_state == 1 && current_state == 3) || 
            (old_state == 3 && current_state == 2) || 
            (old_state == 2 && current_state == 0)) {
            
            enc_counts[enc_index]++; // Saat yönünde dönüyor, sayacı arttır
        } 
        else {
            enc_counts[enc_index]--; // Ters yönde dönüyor, sayacı azalt
        }

        // 4. ADIM: Çarkı 0-19 adım arasına hapsetme (Dairesel döngü)
        if (enc_counts[enc_index] > 19) enc_counts[enc_index] = 0;
        if (enc_counts[enc_index] < 0) enc_counts[enc_index] = 19;

        // Güncel durumu bir sonraki kesme için hafızaya kaydet
        enc_state_history[enc_index] = current_state;
    }
}
/* USER CODE END 4 */

/**
  * @brief  Period elapsed callback in non blocking mode
  * @note   This function is called  when TIM5 interrupt took place, inside
  * HAL_TIM_IRQHandler(). It makes a direct call to HAL_IncTick() to increment
  * a global variable "uwTick" used as application time base.
  * @param  htim : TIM handle
  * @retval None
  */
void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim)
{
  /* USER CODE BEGIN Callback 0 */

  /* USER CODE END Callback 0 */
  if (htim->Instance == TIM5)
  {
    HAL_IncTick();
  }
  /* USER CODE BEGIN Callback 1 */

  /* USER CODE END Callback 1 */
}

/**
  * @brief  This function is executed in case of error occurrence.
  * @retval None
  */
void Error_Handler(void)
{
  /* USER CODE BEGIN Error_Handler_Debug */
  /* User can add his own implementation to report the HAL error return state */
  __disable_irq();
  while (1)
  {
  }
  /* USER CODE END Error_Handler_Debug */
}
#ifdef USE_FULL_ASSERT
/**
  * @brief  Reports the name of the source file and the source line number
  *         where the assert_param error has occurred.
  * @param  file: pointer to the source file name
  * @param  line: assert_param error line source number
  * @retval None
  */
void assert_failed(uint8_t *file, uint32_t line)
{
  /* USER CODE BEGIN 6 */
  /* User can add his own implementation to report the file name and line number,
     ex: printf("Wrong parameters value: file %s on line %d\r\n", file, line) */
  /* USER CODE END 6 */
}
#endif /* USE_FULL_ASSERT */
