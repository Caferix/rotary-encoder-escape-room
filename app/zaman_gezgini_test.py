"""
Zaman Gezgini - STM32 Donanim Test Araci
========================================
Gereksinim: pip install pyserial
Kullanim:   python3 zaman_gezgini_test.py

Test edilenler:
  - 4 enkoder konumu anlık görüntüleme (0-19)
  - Sembol fazı hesaplama (0-3, her 5 adımda bir)
  - OPEN / CLOSE / RESET komut gönderme
  - Ham seri port veri akışı (debug log)
  - Paket istatistikleri (toplam / hatalı)
"""

import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import serial
import serial.tools.list_ports
import threading
import time
import queue

# ── Sabitler ──────────────────────────────────────────────────────────────────

SYMBOLS = ["☽", "✦", "⊕", "⚡"]   # 4 sembol — istediğin görselle değiştirebilirsin
BAUD    = 115200
TIMEOUT = 0.1

# Örnek şifre kombinasyonları (sembol indeksi 0-3)
TEST_COMBOS = [
    [0, 1, 2, 3],   # Bölüm 1
    [3, 0, 1, 2],   # Bölüm 2
    [1, 3, 0, 2],   # Bölüm 3
    [2, 1, 3, 0],   # Bölüm 4
]

# ── Ana Uygulama ───────────────────────────────────────────────────────────────

class TestApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Zaman Gezgini — STM32 Test Aracı")
        self.configure(bg="#0d0d0d")
        self.resizable(True, True)
        self.minsize(780, 600)

        self.ser           = None
        self.running       = False
        self.rx_queue      = queue.Queue()
        self.line_buf      = ""
        self.pkt_total     = 0
        self.pkt_errors    = 0
        self.current_enc   = [0, 0, 0, 0]
        self.current_syms  = [0, 0, 0, 0]
        self.active_combo  = 0            # hangi bölüm şifresi kontrol ediliyor
        self.match_frames  = 0           # stabil eşleşme sayacı
        self.MATCH_NEEDED  = 4           # kaç ardışık frame stabil olmalı

        self._build_ui()
        self.after(50, self._poll_queue)

    # ── UI İnşası ─────────────────────────────────────────────────────────────

    def _build_ui(self):
        PAD  = dict(padx=8, pady=6)
        DARK = "#0d0d0d"
        MID  = "#1a1a1a"
        ACC  = "#c8a96e"   # amber/gold vurgu rengi — escape room havası
        DIM  = "#444444"
        FG   = "#e8e8e8"
        RED  = "#e05555"
        GRN  = "#5ec47a"

        self._c = dict(bg=DARK, fg=FG, acc=ACC, dim=DIM, mid=MID, red=RED, grn=GRN)

        # ── Bağlantı Çubuğu ──────────────────────────────────────────────────
        bar = tk.Frame(self, bg=MID, bd=0)
        bar.pack(fill="x", padx=0, pady=0)

        tk.Label(bar, text="Port:", bg=MID, fg=FG, font=("Courier", 10)).pack(side="left", **PAD)

        self.port_var = tk.StringVar()
        self.port_cb  = ttk.Combobox(bar, textvariable=self.port_var, width=18,
                                     font=("Courier", 10), state="readonly")
        self.port_cb.pack(side="left", pady=6)
        self._refresh_ports()

        tk.Button(bar, text="↻", command=self._refresh_ports,
                  bg=MID, fg=DIM, relief="flat", font=("Courier", 11),
                  cursor="hand2").pack(side="left", padx=2)

        self.conn_btn = tk.Button(bar, text="BAĞLAN", command=self._toggle_connect,
                                  bg=ACC, fg="#0d0d0d", font=("Courier", 10, "bold"),
                                  relief="flat", padx=12, cursor="hand2")
        self.conn_btn.pack(side="left", padx=8, pady=6)

        self.status_lbl = tk.Label(bar, text="● Bağlı değil", bg=MID, fg=RED,
                                   font=("Courier", 10))
        self.status_lbl.pack(side="left", padx=4)

        # paket istatistikleri
        self.stat_lbl = tk.Label(bar, text="PKT: 0  ERR: 0", bg=MID, fg=DIM,
                                 font=("Courier", 9))
        self.stat_lbl.pack(side="right", padx=12)

        # ── Enkoder Paneli ────────────────────────────────────────────────────
        enc_frame = tk.Frame(self, bg=DARK)
        enc_frame.pack(fill="x", padx=12, pady=(10, 4))

        tk.Label(enc_frame, text="ENKODER KONUMLARI",
                 bg=DARK, fg=DIM, font=("Courier", 8)).pack(anchor="w")

        cards = tk.Frame(enc_frame, bg=DARK)
        cards.pack(fill="x", pady=4)

        self.enc_cards = []
        for i in range(4):
            card = tk.Frame(cards, bg=MID, bd=0, highlightthickness=1,
                            highlightbackground=DIM)
            card.pack(side="left", expand=True, fill="x", padx=4)

            tk.Label(card, text=f"ÇARK {i+1}",
                     bg=MID, fg=DIM, font=("Courier", 8)).pack(pady=(6,0))

            count_lbl = tk.Label(card, text="0",
                                 bg=MID, fg=ACC, font=("Courier", 28, "bold"))
            count_lbl.pack()

            sym_lbl = tk.Label(card, text=SYMBOLS[0],
                               bg=MID, fg=FG, font=("Courier", 20))
            sym_lbl.pack()

            phase_lbl = tk.Label(card, text="Sembol 1 / 4",
                                 bg=MID, fg=DIM, font=("Courier", 8))
            phase_lbl.pack(pady=(0,6))

            # 20 adımlık progress bar (5 adım = 1 sembol)
            seg_frame = tk.Frame(card, bg=MID)
            seg_frame.pack(pady=(0,8))
            segs = []
            for s in range(20):
                seg = tk.Frame(seg_frame, width=7, height=4, bg=DIM)
                seg.pack(side="left", padx=1)
                segs.append(seg)

            self.enc_cards.append({
                "frame": card, "count": count_lbl,
                "sym": sym_lbl, "phase": phase_lbl, "segs": segs
            })

        # ── Şifre Kontrol Paneli ──────────────────────────────────────────────
        combo_frame = tk.Frame(self, bg=DARK)
        combo_frame.pack(fill="x", padx=12, pady=4)

        header = tk.Frame(combo_frame, bg=DARK)
        header.pack(fill="x")

        tk.Label(header, text="ŞİFRE KONTROLÜ",
                 bg=DARK, fg=DIM, font=("Courier", 8)).pack(side="left")

        tk.Label(header, text="Aktif bölüm:", bg=DARK, fg=DIM,
                 font=("Courier", 8)).pack(side="left", padx=(16,4))

        self.combo_var = tk.IntVar(value=0)
        for i in range(4):
            rb = tk.Radiobutton(header, text=f"B{i+1}", variable=self.combo_var,
                                value=i, command=self._on_combo_change,
                                bg=DARK, fg=FG, selectcolor=MID,
                                activebackground=DARK, activeforeground=ACC,
                                font=("Courier", 9))
            rb.pack(side="left", padx=2)

        self.match_frame = tk.Frame(combo_frame, bg=MID, bd=0,
                                    highlightthickness=1, highlightbackground=DIM)
        self.match_frame.pack(fill="x", pady=4)

        inner = tk.Frame(self.match_frame, bg=MID)
        inner.pack(fill="x", padx=8, pady=6)

        tk.Label(inner, text="Hedef:", bg=MID, fg=DIM,
                 font=("Courier", 9)).pack(side="left")

        self.target_lbls = []
        for i in range(4):
            f = tk.Frame(inner, bg=MID)
            f.pack(side="left", padx=6)
            sym_l = tk.Label(f, text=SYMBOLS[TEST_COMBOS[0][i]],
                             bg=MID, fg=ACC, font=("Courier", 14))
            sym_l.pack()
            idx_l = tk.Label(f, text=f"({TEST_COMBOS[0][i]})",
                             bg=MID, fg=DIM, font=("Courier", 8))
            idx_l.pack()
            self.target_lbls.append((sym_l, idx_l))

        self.match_lbl = tk.Label(inner, text="—",
                                  bg=MID, fg=DIM, font=("Courier", 11, "bold"))
        self.match_lbl.pack(side="right", padx=8)

        self.progress_bar = tk.Canvas(self.match_frame, height=4, bg=DIM,
                                      highlightthickness=0)
        self.progress_bar.pack(fill="x", padx=8, pady=(0,6))

        # ── Komut Butonları ───────────────────────────────────────────────────
        cmd_frame = tk.Frame(self, bg=DARK)
        cmd_frame.pack(fill="x", padx=12, pady=6)

        tk.Label(cmd_frame, text="KOMUTLAR",
                 bg=DARK, fg=DIM, font=("Courier", 8)).pack(anchor="w")

        btns = tk.Frame(cmd_frame, bg=DARK)
        btns.pack(fill="x", pady=4)

        btn_specs = [
            ("OPEN",  GRN,  "#0d0d0d", self._send_open),
            ("CLOSE", RED,  "#0d0d0d", self._send_close),
            ("RESET", ACC,  "#0d0d0d", self._send_reset),
        ]
        for label, bg, fg, cmd in btn_specs:
            tk.Button(btns, text=label, command=cmd,
                      bg=bg, fg=fg, font=("Courier", 11, "bold"),
                      relief="flat", padx=20, pady=6,
                      cursor="hand2").pack(side="left", padx=6)

        tk.Label(btns, text="OPEN=solenoid aç  CLOSE=kapat  RESET=sayaçları sıfırla",
                 bg=DARK, fg=DIM, font=("Courier", 8)).pack(side="left", padx=8)

        # ── Debug Log ─────────────────────────────────────────────────────────
        log_frame = tk.Frame(self, bg=DARK)
        log_frame.pack(fill="both", expand=True, padx=12, pady=(4,12))

        log_header = tk.Frame(log_frame, bg=DARK)
        log_header.pack(fill="x")

        tk.Label(log_header, text="HAM VERİ AKIŞI",
                 bg=DARK, fg=DIM, font=("Courier", 8)).pack(side="left")

        tk.Button(log_header, text="Temizle", command=self._clear_log,
                  bg=DARK, fg=DIM, font=("Courier", 8), relief="flat",
                  cursor="hand2").pack(side="right")

        self.log = scrolledtext.ScrolledText(
            log_frame, height=10, bg="#111111", fg="#3a7a3a",
            font=("Courier", 9), relief="flat", bd=0,
            insertbackground=FG, state="disabled"
        )
        self.log.pack(fill="both", expand=True, pady=4)
        self.log.tag_config("err",  foreground="#e05555")
        self.log.tag_config("cmd",  foreground=ACC)
        self.log.tag_config("info", foreground="#5599cc")
        self.log.tag_config("ok",   foreground="#5ec47a")

        self.geometry("780x680")
        self.protocol("WM_DELETE_WINDOW", self._on_close)
        self.bind("<F11>", lambda e: self.attributes("-zoomed", not self.attributes("-zoomed")))
        self.bind("<Escape>", lambda e: self.attributes("-zoomed", False))

    # ── Port İşlemleri ────────────────────────────────────────────────────────

    def _refresh_ports(self):
        ports = [p.device for p in serial.tools.list_ports.comports()]
        self.port_cb["values"] = ports
        if ports:
            # USB CDC genellikle /dev/ttyACM* veya COM* ile başlar
            usb = [p for p in ports if "ACM" in p or "USB" in p or "usbmodem" in p]
            self.port_var.set(usb[0] if usb else ports[0])

    def _toggle_connect(self):
        if self.running:
            self._disconnect()
        else:
            self._connect()

    def _connect(self):
        port = self.port_var.get()
        if not port:
            messagebox.showerror("Hata", "Port seçilmedi.")
            return
        try:
            self.ser = serial.Serial(port, BAUD, timeout=TIMEOUT)
            time.sleep(0.1)
            self.ser.reset_input_buffer()
            self.running = True
            threading.Thread(target=self._read_loop, daemon=True).start()
            self.conn_btn.config(text="KES", bg="#e05555")
            self.status_lbl.config(text=f"● {port}", fg=self._c["grn"])
            self._log(f"Bağlandı: {port} @ {BAUD} baud", "info")
        except serial.SerialException as e:
            messagebox.showerror("Bağlantı Hatası", str(e))

    def _disconnect(self):
        self.running = False
        time.sleep(0.15)
        if self.ser and self.ser.is_open:
            self.ser.close()
        self.conn_btn.config(text="BAĞLAN", bg=self._c["acc"])
        self.status_lbl.config(text="● Bağlı değil", fg=self._c["red"])
        self._log("Bağlantı kesildi.", "info")

    # ── Seri Okuma Thread'i (Serial Fragmentation korumalı) ───────────────────

    def _read_loop(self):
        buf = ""
        while self.running:
            try:
                if self.ser.in_waiting:
                    chunk = self.ser.read(self.ser.in_waiting).decode("ascii", errors="ignore")
                    buf += chunk
                    while "\n" in buf:
                        line, buf = buf.split("\n", 1)
                        line = line.strip()
                        if line:
                            self.rx_queue.put(("data", line))
                else:
                    time.sleep(0.005)
            except Exception as e:
                if self.running:
                    self.rx_queue.put(("err", str(e)))
                break

    # ── Kuyruk İşleme (GUI Thread) ────────────────────────────────────────────

    def _poll_queue(self):
        try:
            while True:
                kind, payload = self.rx_queue.get_nowait()
                if kind == "data":
                    self._process_line(payload)
                elif kind == "err":
                    self._log(f"HATA: {payload}", "err")
                    self._disconnect()
        except queue.Empty:
            pass
        self.after(16, self._poll_queue)   # ~60 Hz — firmware ile eşleşik

    def _process_line(self, line):
        self.pkt_total += 1
        self._log(line)

        parts = line.split(",")
        if len(parts) != 4:
            self.pkt_errors += 1
            self._log(f"  ↳ parse hatası: 4 değer beklendi, {len(parts)} geldi", "err")
            self._update_stats()
            return

        try:
            values = [int(p.strip()) for p in parts]
        except ValueError:
            self.pkt_errors += 1
            self._log("  ↳ parse hatası: int dönüşümü başarısız", "err")
            self._update_stats()
            return

        if not all(0 <= v <= 19 for v in values):
            self.pkt_errors += 1
            self._log(f"  ↳ aralık hatası: değerler 0-19 dışında → {values}", "err")
            self._update_stats()
            return

        self.current_enc  = values
        self.current_syms = [v // 5 for v in values]
        self._update_encoder_cards()
        self._check_combo()
        self._update_stats()

    # ── UI Güncelleme ─────────────────────────────────────────────────────────

    def _update_encoder_cards(self):
        ACC = self._c["acc"]
        DIM = self._c["dim"]
        GRN = self._c["grn"]
        MID = self._c["mid"]

        target = TEST_COMBOS[self.active_combo]

        for i, card in enumerate(self.enc_cards):
            val = self.current_enc[i]
            sym = self.current_syms[i]

            card["count"].config(text=str(val))
            card["sym"].config(text=SYMBOLS[sym])
            card["phase"].config(text=f"Sembol {sym+1} / 4")

            # Hedefle eşleşiyorsa kartı vurgula
            match = (sym == target[i])
            card["frame"].config(
                highlightbackground=GRN if match else DIM
            )
            card["count"].config(fg=GRN if match else ACC)

            # 20 segment bar
            for s, seg in enumerate(card["segs"]):
                if s < val:
                    # hangi sembol aralığındayız
                    color = ["#4a6fa5", "#7a5ea5", "#5ea57a", "#a57a5e"][s // 5]
                    seg.config(bg=color)
                else:
                    seg.config(bg=DIM)

    def _check_combo(self):
        target  = TEST_COMBOS[self.active_combo]
        matched = all(self.current_syms[i] == target[i] for i in range(4))

        if matched:
            self.match_frames += 1
        else:
            self.match_frames = 0

        ratio = min(self.match_frames / self.MATCH_NEEDED, 1.0)
        self._update_progress(ratio)

        if self.match_frames >= self.MATCH_NEEDED:
            self.match_frames = 0
            combo_name = f"Bölüm {self.active_combo + 1}"
            if self.active_combo == 3:
                # Son bölüm — solenoid tetikle
                self.match_lbl.config(text="✓ AÇILIYOR!", fg=self._c["grn"])
                self._log(f"[{combo_name}] ŞİFRE DOĞRU — Solenoid tetikleniyor!", "ok")
                self._send_open()
            else:
                self.match_lbl.config(text=f"✓ B{self.active_combo+1} TAMAM", fg=self._c["grn"])
                self._log(f"[{combo_name}] ŞİFRE DOĞRU — Sonraki bölüme geçiliyor.", "ok")
                # Otomatik sonraki bölüme geç
                next_combo = self.active_combo + 1
                self.combo_var.set(next_combo)
                self._on_combo_change()
        else:
            if matched:
                self.match_lbl.config(
                    text=f"≈ {self.match_frames}/{self.MATCH_NEEDED}",
                    fg=self._c["acc"]
                )
            else:
                self.match_lbl.config(text="—", fg=self._c["dim"])

    def _update_progress(self, ratio):
        c = self.progress_bar
        c.delete("all")
        w = c.winfo_width()
        if w > 0 and ratio > 0:
            color = self._c["grn"] if ratio >= 1.0 else self._c["acc"]
            c.create_rectangle(0, 0, int(w * ratio), 4, fill=color, outline="")

    def _on_combo_change(self):
        self.active_combo = self.combo_var.get()
        self.match_frames = 0
        target = TEST_COMBOS[self.active_combo]
        for i, (sym_l, idx_l) in enumerate(self.target_lbls):
            sym_l.config(text=SYMBOLS[target[i]])
            idx_l.config(text=f"({target[i]})")
        self.match_lbl.config(text="—", fg=self._c["dim"])
        self._log(f"Aktif bölüm: {self.active_combo + 1}  "
                  f"Hedef semboller: {[SYMBOLS[t] for t in target]}", "info")

    def _update_stats(self):
        self.stat_lbl.config(
            text=f"PKT: {self.pkt_total}  ERR: {self.pkt_errors}"
        )

    # ── Komut Gönderme ────────────────────────────────────────────────────────

    def _send(self, cmd: str):
        if not self.ser or not self.ser.is_open:
            self._log("Bağlantı yok — komut gönderilemedi.", "err")
            return
        try:
            self.ser.write(cmd.encode("ascii"))
            self._log(f"→ {cmd.strip()}", "cmd")
        except serial.SerialException as e:
            self._log(f"Gönderme hatası: {e}", "err")

    def _send_open(self):  self._send("OPEN\n")
    def _send_close(self): self._send("CLOSE\n")
    def _send_reset(self):
        self._send("RESET\n")
        self.match_frames = 0
        self._log("Sayaçlar sıfırlandı.", "info")

    # ── Log ───────────────────────────────────────────────────────────────────

    def _log(self, msg: str, tag: str = ""):
        self.log.config(state="normal")
        ts = time.strftime("%H:%M:%S")
        self.log.insert("end", f"[{ts}] {msg}\n", tag)
        self.log.see("end")
        self.log.config(state="disabled")

    def _clear_log(self):
        self.log.config(state="normal")
        self.log.delete("1.0", "end")
        self.log.config(state="disabled")

    # ── Kapat ─────────────────────────────────────────────────────────────────

    def _on_close(self):
        self._disconnect()
        self.destroy()


# ── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app = TestApp()
    app.mainloop()
