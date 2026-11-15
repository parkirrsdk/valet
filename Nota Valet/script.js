// ======================================================
// NOTA VALET SOS
// SUPABASE
// TANPA LOGIN
// ======================================================

// ======================================================
// KONEKSI SUPABASE
// ======================================================

const SUPABASE_URL = "https://txncojwgxhjfiqvswrvz.supabase.co";

const SUPABASE_KEY = "sb_publishable_eGCS-OBZaoJ-bkGk5XdiWw_8rHaB2lx";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ======================================================
// AMBIL DATA RIWAYAT DARI SUPABASE
// ======================================================

async function ambilRiwayat() {
  const { data, error } = await supabaseClient
    .from("riwayat_valet")
    .select("*")
    .order("tanggal_sumber", {
      ascending: false,
    });

  if (error) {
    console.error("Gagal mengambil riwayat:", error);

    alert("Gagal mengambil data dari database.\n\n" + error.message);

    return [];
  }

  return data.map((item) => ({
    id: item.id,

    noNota: item.no_nota,

    nomorPolisi: item.nomor_polisi,

    tipeMobil: item.tipe_mobil,

    biayaValet: item.biaya_valet || "",

    noHP: item.no_hp || "",

    tanggalTransaksi: item.tanggal_transaksi,

    waktuMasuk: item.waktu_masuk,

    tanggalSumber: item.tanggal_sumber,
  }));
}

// ======================================================
// FORMAT TANGGAL INDONESIA
// ======================================================

function formatTanggalIndonesia(tanggal) {
  const bulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const d = new Date(tanggal);

  return d.getDate() + " " + bulan[d.getMonth()] + " " + d.getFullYear();
}

// ======================================================
// FORMAT WAKTU
// ======================================================

function formatWaktu(tanggal) {
  const d = new Date(tanggal);

  let jam = d.getHours();

  const menit = String(d.getMinutes()).padStart(2, "0");

  const periode = jam >= 12 ? "PM" : "AM";

  jam = jam % 12 || 12;

  return jam + ":" + menit + " " + periode;
}

// ======================================================
// NOMOR NOTA BERIKUTNYA
// ======================================================
//
// Fungsi ini hanya untuk MENAMPILKAN nomor berikutnya
// pada form.
//
// Nomor resmi transaksi tetap dibuat oleh DATABASE
// menggunakan sequence nomor_nota_seq.
// ======================================================

async function nomorNotaBerikutnya() {
  const { data, error } = await supabaseClient
    .from("riwayat_valet")
    .select("no_nota")
    .order("id", {
      ascending: false,
    })
    .limit(1);

  if (error || !data || data.length === 0) {
    return "0001";
  }

  const nomorTerakhir = parseInt(data[0].no_nota, 10);

  if (isNaN(nomorTerakhir)) {
    return "0001";
  }

  return String(nomorTerakhir + 1).padStart(4, "0");
}

// ======================================================
// TAMPILKAN NOMOR NOTA PADA PREVIEW
// ======================================================

function tampilkanNomorNota(nomorNota) {
  const elemen = document.getElementById("pNoNota");

  if (elemen) {
    elemen.textContent = nomorNota;

    return;
  }

  // Jika pNoNota belum ada,
  // cari baris NO NOTA

  const semuaBaris = document.querySelectorAll(".nota-preview .baris");

  for (const baris of semuaBaris) {
    const teks = baris.textContent.trim().toUpperCase();

    if (teks.includes("NO NOTA")) {
      const kanan = baris.querySelector(".baris-kanan");

      if (kanan) {
        kanan.textContent = ": " + nomorNota;
      }

      break;
    }
  }
}

// ======================================================
// BUAT DAN SIMPAN NOTA
// ======================================================

async function buatNota() {
  // ----------------------------------------------------
  // Ambil elemen
  // ----------------------------------------------------

  const noNotaInput = document.getElementById("noNota");

  const nomorPolisiInput = document.getElementById("nomorPolisi");

  const tipeMobilInput = document.getElementById("tipeMobil");

  const biayaValetInput = document.getElementById("biayaValet");

  const noHPInput = document.getElementById("noHP");

  if (!nomorPolisiInput || !tipeMobilInput || !biayaValetInput || !noHPInput) {
    console.error("Elemen form tidak ditemukan.");

    return null;
  }

  // ----------------------------------------------------
  // Ambil nilai input
  // ----------------------------------------------------

  const nomorPolisi = nomorPolisiInput.value.trim().toUpperCase();

  const tipeMobil = tipeMobilInput.value.trim();

  const biayaValet = biayaValetInput.value.trim();

  const noHP = noHPInput.value.trim();

  // ----------------------------------------------------
  // Validasi
  // ----------------------------------------------------

  if (!nomorPolisi || !tipeMobil) {
    alert("Lengkapi Nomor Polisi dan Tipe Mobil!");

    if (!nomorPolisi) {
      nomorPolisiInput.focus();
    } else {
      tipeMobilInput.focus();
    }

    return null;
  }

  // ----------------------------------------------------
  // Waktu transaksi
  // ----------------------------------------------------

  const sekarang = new Date();

  const tanggalTransaksi = formatTanggalIndonesia(sekarang);

  const waktuMasuk = formatWaktu(sekarang);

  const tanggalSumber = sekarang.toISOString();

  // ----------------------------------------------------
  // SIMPAN KE SUPABASE
  // ----------------------------------------------------
  //
  // TIDAK mengirim no_nota.
  //
  // Database akan membuat nomor menggunakan:
  //
  // nomor_nota_seq
  //
  // sehingga nomor tetap berurutan walaupun data dihapus.
  // ----------------------------------------------------

  const { data: notaTersimpan, error } = await supabaseClient
    .from("riwayat_valet")
    .insert([
      {
        nomor_polisi: nomorPolisi,

        tipe_mobil: tipeMobil,

        biaya_valet: biayaValet,

        no_hp: noHP,

        tanggal_transaksi: tanggalTransaksi,

        waktu_masuk: waktuMasuk,

        tanggal_sumber: tanggalSumber,
      },
    ])
    .select()
    .single();

  // ----------------------------------------------------
  // Jika gagal
  // ----------------------------------------------------

  if (error) {
    console.error("Gagal menyimpan nota:", error);

    alert("Nota gagal disimpan ke database.\n\n" + error.message);

    return null;
  }

  // ----------------------------------------------------
  // Nomor resmi dari database
  // ----------------------------------------------------

  const nomorNotaDatabase = notaTersimpan.no_nota;

  // ----------------------------------------------------
  // Tampilkan preview nota
  // ----------------------------------------------------

  const notaHasil = document.getElementById("notaHasil");

  if (notaHasil) {
    notaHasil.style.display = "block";
  }

  // Nomor nota

  tampilkanNomorNota(nomorNotaDatabase);

  // Nomor polisi

  const pPolisi = document.getElementById("pPolisi");

  if (pPolisi) {
    pPolisi.textContent = nomorPolisi;
  }

  // Tipe mobil

  const pTipe = document.getElementById("pTipe");

  if (pTipe) {
    pTipe.textContent = tipeMobil;
  }

  // Tanggal

  const pTanggal = document.getElementById("pTanggal");

  if (pTanggal) {
    pTanggal.textContent = tanggalTransaksi;
  }

  // Waktu

  const pWaktu = document.getElementById("pWaktu");

  if (pWaktu) {
    pWaktu.textContent = waktuMasuk;
  }

  // Biaya

  const pBiaya = document.getElementById("pBiaya");

  if (pBiaya) {
    pBiaya.textContent = biayaValet || "-";
  }

  // Nomor HP

  const pHP = document.getElementById("pHP");

  if (pHP) {
    pHP.textContent = noHP || "-";
  }

  // ----------------------------------------------------
  // Reset form
  // ----------------------------------------------------

  nomorPolisiInput.value = "";

  tipeMobilInput.value = "";

  biayaValetInput.value = "";

  noHPInput.value = "";

  // ----------------------------------------------------
  // Ambil nomor berikutnya
  // ----------------------------------------------------

  if (noNotaInput) {
    noNotaInput.value = await nomorNotaBerikutnya();
  }

  // ----------------------------------------------------
  // Fokus ke tombol cetak
  // ----------------------------------------------------

  setTimeout(() => {
    const tombolCetak = document.querySelector(".btn-cetak");

    if (tombolCetak) {
      tombolCetak.focus();
    }
  }, 300);

  console.log("Nota berhasil disimpan:", nomorNotaDatabase);

  return notaTersimpan;
}

// ======================================================
// MUAT RIWAYAT
// ======================================================

async function muatRiwayat(kataNama = "", tglCari = "") {
  const riwayat = await ambilRiwayat();

  const tbody = document.getElementById("tabelRiwayat");

  if (!tbody) {
    return;
  }

  tbody.innerHTML = "";

  let data = riwayat;
  // ----------------------------------------------------
  // Cari nomor polisi atau tipe mobil
  // ----------------------------------------------------

  if (kataNama) {
    const kata = kataNama.toLowerCase();

    data = data.filter(
      (r) =>
        r.nomorPolisi.toLowerCase().includes(kata) ||
        r.tipeMobil.toLowerCase().includes(kata),
    );
  }

  // ----------------------------------------------------
  // Cari tanggal
  // ----------------------------------------------------

  if (tglCari) {
    data = data.filter((r) => {
      if (!r.tanggalSumber) {
        return false;
      }

      const tanggalData = new Date(r.tanggalSumber);

      const tahun = tanggalData.getFullYear();

      const bulan = String(tanggalData.getMonth() + 1).padStart(2, "0");

      const hari = String(tanggalData.getDate()).padStart(2, "0");

      const tanggalLokal = `${tahun}-${bulan}-${hari}`;

      return tanggalLokal === tglCari;
    });
  }

  // ----------------------------------------------------
  // Tampilkan data
  // ----------------------------------------------------

  data.forEach((item) => {
    const baris = document.createElement("tr");

    baris.innerHTML = `

        <td>
          ${item.noNota}
        </td>

        <td>
          ${item.nomorPolisi}
        </td>

        <td>
          ${item.tipeMobil}
        </td>

        <td>
          ${item.tanggalTransaksi}
        </td>

        <td>
          ${item.waktuMasuk}
        </td>

        <td>
          ${item.biayaValet}
        </td>

        <td>
          ${item.noHP || "-"}
        </td>

        <td>

  <button
    class="btn-hapus"
    onclick="cetakUlang(${item.id})"
    style="margin-right:5px;"
  >
    🖨️ Print
  </button>

  <button
    class="btn-hapus"
    onclick="hapusSatu(${item.id})"
  >
    Hapus
  </button>

</td>

      `;

    tbody.appendChild(baris);
  });
}

// ======================================================
// FILTER RIWAYAT
// ======================================================

async function filterRiwayat() {
  const kata = document.getElementById("cari")?.value || "";

  const tanggal = document.getElementById("cariTanggal")?.value || "";

  await muatRiwayat(kata, tanggal);
}

// ======================================================
// HAPUS SATU NOTA
// ======================================================

async function hapusSatu(id) {
  if (!confirm("Yakin hapus nota ini?")) {
    return;
  }

  const { error } = await supabaseClient

    .from("riwayat_valet")

    .delete()

    .eq("id", id);

  if (error) {
    console.error("Gagal menghapus nota:", error);

    alert("Nota gagal dihapus.\n\n" + error.message);

    return;
  }

  await filterRiwayat();

  if (typeof muatDashboard === "function") {
    await muatDashboard();
  }
}

// ======================================================
// HAPUS SEMUA NOTA
// ======================================================

async function hapusSemua() {
  if (!confirm("Yakin hapus SEMUA riwayat?")) {
    return;
  }

  const { error } = await supabaseClient

    .from("riwayat_valet")

    .delete()

    .not("id", "is", null);

  if (error) {
    console.error("Gagal menghapus semua riwayat:", error);

    alert("Semua riwayat gagal dihapus.\n\n" + error.message);

    return;
  }

  await filterRiwayat();

  if (typeof muatDashboard === "function") {
    await muatDashboard();
  }
}

// ======================================================
// CETAK ULANG NOTA DARI RIWAYAT
// ======================================================

async function cetakUlang(id) {
  try {
    // Ambil data nota berdasarkan ID dari Supabase
    const { data: item, error } = await supabaseClient
      .from("riwayat_valet")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Gagal mengambil data nota:", error);
      alert("Data nota tidak ditemukan.");
      return;
    }

    if (!item) {
      alert("Data nota tidak ditemukan.");
      return;
    }

    // URL absolut style.css agar pasti terbaca di window cetak
    const cssUrl = new URL("style.css", window.location.href).href;

    // Buka window baru untuk mencetak
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      alert("Popup diblokir browser. Silakan izinkan popup untuk halaman ini.");
      return;
    }

    printWindow.document.open();

    printWindow.document.write(`
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Cetak Nota - ${item.no_nota || ""}</title>

    <link rel="stylesheet" href="${cssUrl}">

    <style>
        body {
            background: #ffffff;
        }

        /*
         * Pastikan tampilan di window cetak
         * mengikuti format nota.html
         */
        .container {
            margin-left: 0;
            padding: 0;
            max-width: none;
            width: 148mm;
        }

        .kartu {
            width: 148mm;
            max-width: 148mm;
            margin: 0;
            padding: 0;
        }

        .nota-preview {
            display: block !important;
        }

        @media print {
            html,
            body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
            }

            .container {
                width: 148mm !important;
                max-width: 148mm !important;
                margin: 0 !important;
                padding: 0 !important;
            }

            .kartu {
                width: 148mm !important;
                max-width: 148mm !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
                background: #ffffff !important;
            }

            .nota-preview {
                display: block !important;
            }

            .btn-cetak {
                display: none !important;
            }
        }
    </style>
</head>

<body>

    <div class="container">

        <div class="kartu">

            <div class="nota-preview" id="notaHasil">

                <div style="
                    display:flex;
                    align-items:flex-start;
                    margin-bottom:10px;
                ">
                    <div class="judul-nota">
                        <h2>BUKTI PENDAFTARAN VALET</h2>
                    </div>
                </div>

                <div class="baris">
                    <div class="baris-kiri">
                        NO NOTA
                    </div>

                    <div class="baris-kanan" style="font-weight: bold;">
                        : ${item.no_nota || ""}
                    </div>
                </div>

                <div class="baris">
                    <div class="baris-kiri">
                        NOMOR POLISI
                    </div>

                    <div class="baris-kanan" style="font-weight: bold;">
                        : ${item.nomor_polisi || ""}
                    </div>
                </div>

                <div class="baris">
                    <div class="baris-kiri">
                        TIPE MOBIL
                    </div>

                    <div class="baris-kanan">
                        : ${item.tipe_mobil || ""}
                    </div>
                </div>

                <div class="baris">
                    <div class="baris-kiri">
                        TGL TRANSAKSI
                    </div>

                    <div class="baris-kanan">
                        : ${item.tanggal_transaksi || ""}
                    </div>
                </div>

                <div class="baris">
                    <div class="baris-kiri">
                        WAKTU MASUK
                    </div>

                    <div class="baris-kanan">
                        : ${item.waktu_masuk || ""}
                    </div>
                </div>

                <div class="baris">
                    <div class="baris-kiri">
                        BIAYA VALET
                    </div>

                    <div class="baris-kanan">
                        : ${item.biaya_valet || ""}
                    </div>
                </div>

                <div class="baris">
                    <div class="baris-kiri">
                        NO HP
                    </div>

                    <div class="baris-kanan">
                        : ${item.no_hp || ""}
                    </div>
                </div>

                <div class="catatan">
                    NB: JAM OPERASIONAL SAMPAI PUKUL 17.00
                </div>

                <button
                    class="btn-cetak"
                    onclick="window.print()"
                    style="width:auto; margin-top:20px;"
                >
                    CETAK
                </button>

            </div>

        </div>

    </div>

  </body>
  </html>
        `);

    printWindow.document.close();

    // Tunggu CSS dan halaman selesai dimuat
    printWindow.onload = function () {
      setTimeout(function () {
        printWindow.focus();
        printWindow.print();
      }, 500);
    };
  } catch (err) {
    console.error("Terjadi kesalahan saat mencetak nota:", err);
    alert("Terjadi kesalahan saat mencetak nota.");
  }
}

// async function cetakUlang(id) {

//   // Ambil nota berdasarkan ID dari database
//   const { data: item, error } =
//     await supabaseClient
//       .from("riwayat_valet")
//       .select("*")
//       .eq("id", id)
//       .single();

//   // Jika gagal mengambil data
//   if (error || !item) {

//     console.error(
//       "Gagal mengambil nota:",
//       error
//     );

//     alert(
//       "Data nota tidak ditemukan."
//     );

//     return;
//   }

//   // ====================================================
//   // Buat halaman cetak
//   // ====================================================

//   const jendela =
//     window.open(
//       "",
//       "_blank",
//       "width=900,height=700"
//     );

//   if (!jendela) {

//     alert(
//       "Popup diblokir browser. Izinkan popup untuk website ini."
//     );

//     return;
//   }

//   // ====================================================
//   // HTML NOTA
//   // Bentuk mengikuti nota yang sudah ada
//   // ====================================================

//   jendela.document.write(`

// <!DOCTYPE html>

// <html lang="id">

// <head>

//   <meta charset="UTF-8">

//   <title>
//     Nota ${item.no_nota}
//   </title>

//   <link
//     rel="stylesheet"
//     href="style.css"
//   >

//   <style>

//     body {
//       background: white;
//     }

//     @media print {

//       body {
//         margin: 0;
//         padding: 0;
//         background: white;
//       }

//       .nota-preview {
//         display: block !important;
//       }

//       .btn-cetak {
//         display: none !important;
//       }

//     }

//   </style>

// </head>

// <body>

//   <div
//     class="nota-preview"
//     style="display:block;"
//   >

//     <div
//       style="
//         display:flex;
//         align-items:flex-start;
//         margin-bottom:10px;
//       "
//     >
//       <div class="judul-nota">

//         <h2>
//           BUKTI PENDAFTARAN VALET
//         </h2>

//       </div>

//     </div>

//     <!-- NOMOR NOTA -->

//     <div class="baris">

//       <div class="baris-kiri">
//         NO NOTA
//       </div>

//       <div class="baris-kanan">
//         : ${item.no_nota}
//       </div>

//     </div>

//     <!-- NOMOR POLISI -->

//     <div class="baris">

//       <div class="baris-kiri">
//         NOMOR POLISI
//       </div>

//       <div class="baris-kanan">
//         : ${item.nomor_polisi}
//       </div>

//     </div>

//     <!-- TIPE MOBIL -->

//     <div class="baris">

//       <div class="baris-kiri">
//         TIPE MOBIL
//       </div>

//       <div class="baris-kanan">
//         : ${item.tipe_mobil}
//       </div>

//     </div>

//     <!-- TANGGAL -->

//     <div class="baris">

//       <div class="baris-kiri">
//         TANGGAL TRANSAKSI
//       </div>

//       <div class="baris-kanan">
//         : ${item.tanggal_transaksi}
//       </div>

//     </div>

//     <!-- WAKTU -->

//     <div class="baris">

//       <div class="baris-kiri">
//         WAKTU MASUK
//       </div>

//       <div class="baris-kanan">
//         : ${item.waktu_masuk}
//       </div>

//     </div>

//     <!-- BIAYA -->

//     <div class="baris">

//       <div class="baris-kiri">
//         BIAYA VALET
//       </div>

//       <div class="baris-kanan">
//         : ${item.biaya_valet || "-"}
//       </div>

//     </div>

//     <!-- NO HP -->

//     <div class="baris">

//       <div class="baris-kiri">
//         NO HP
//       </div>

//       <div class="baris-kanan">
//         : ${item.no_hp || "-"}
//       </div>

//     </div>

//     <!-- CATATAN -->

//     <div class="catatan">

//       NB: JAM OPERASIONAL SAMPAI PUKUL 17.00

//     </div>

//     <button
//       class="btn-cetak"
//       onclick="window.print()"
//       style="
//         width:auto;
//         margin-top:20px;
//       "
//     >
//       🖨️ Cetak Nota
//     </button>

//   </div>

// </body>

// </html>

//   `);

//   jendela.document.close();

//   // ====================================================
//   // Setelah halaman selesai dimuat → langsung print
//   // ====================================================

//   jendela.onload = function() {

//     setTimeout(() => {

//       jendela.focus();

//       jendela.print();

//     }, 500);

//   };

// }
// ======================================================
// DASHBOARD
// ======================================================

async function muatDashboard() {
  const riwayat = await ambilRiwayat();

  const sekarang = new Date();

  const daftarBulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const bulanNama = daftarBulan[sekarang.getMonth()];

  const namaBulanIni = bulanNama + " " + sekarang.getFullYear();

  const hariIni = formatTanggalIndonesia(sekarang);

  let totalHari = 0;

  let totalBulan = 0;

  let totalBayar = 0;

  // ----------------------------------------------------
  // Hitung statistik
  // ----------------------------------------------------

  riwayat.forEach((r) => {
    // Hari ini

    if (r.tanggalTransaksi === hariIni) {
      totalHari++;
    }

    // Bulan ini

    if (r.tanggalTransaksi.includes(namaBulanIni)) {
      totalBulan++;
    }

    // Gratis

    if (/free|gratis/i.test(r.biayaValet)) {
      return;
    }

    // Berbayar

    const angka = parseInt((r.biayaValet || "").replace(/[^0-9]/g, ""));

    if (!isNaN(angka)) {
      totalBayar += angka;
    }
  });

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------

  const totalSemua = document.getElementById("totalSemua");

  const totalBulanElement = document.getElementById("totalBulan");

  const totalHariElement = document.getElementById("totalHari");

  const totalPendapatan = document.getElementById("totalPendapatan");

  if (totalSemua) {
    totalSemua.textContent = riwayat.length;
  }

  if (totalBulanElement) {
    totalBulanElement.textContent = totalBulan;
  }

  if (totalHariElement) {
    totalHariElement.textContent = totalHari;
  }

  if (totalPendapatan) {
    totalPendapatan.textContent = "Rp " + totalBayar.toLocaleString("id-ID");
  }

  // ----------------------------------------------------
  // 5 nota terbaru
  // ----------------------------------------------------

  const tbody = document.getElementById("tabelTerbaru");

  if (!tbody) {
    return;
  }

  tbody.innerHTML = "";

  riwayat.slice(0, 5).forEach((item) => {
    const baris = document.createElement("tr");

    baris.innerHTML = `

          <td>
            ${item.tanggalTransaksi}
          </td>

          <td>
            ${item.nomorPolisi}
          </td>

          <td>
            ${item.tipeMobil}
                      </td>

          <td>
            ${item.biayaValet}
          </td>

        `;

    tbody.appendChild(baris);
  });
}

// ======================================================
// AUTOCOMPLETE NOMOR POLISI DARI RIWAYAT SUPABASE
// ======================================================

let cacheKendaraan = [];
let pilihanSaranAktif = -1;

async function muatDataRekomendasi() {
  const inputPolisi = document.getElementById("nomorPolisi");
  if (!inputPolisi) return;

  const { data, error } = await supabaseClient
    .from("riwayat_valet")
    .select("nomor_polisi, tipe_mobil, no_hp, biaya_valet, tanggal_sumber")
    .order("tanggal_sumber", { ascending: false })
    .limit(500);

  if (error) {
    console.error("Gagal memuat rekomendasi kendaraan:", error);
    cacheKendaraan = [];
    return;
  }

  // Ambil satu data terbaru untuk setiap nomor polisi.
  const sudahAda = new Set();
  cacheKendaraan = [];

  (data || []).forEach((item) => {
    const polisi = String(item.nomor_polisi || "")
      .trim()
      .toUpperCase();
    if (!polisi || sudahAda.has(polisi)) return;

    sudahAda.add(polisi);
    cacheKendaraan.push({
      nomorPolisi: polisi,
      tipeMobil: item.tipe_mobil || "",
      noHP: item.no_hp || "",
      biayaValet: item.biaya_valet || "",
    });
  });
}

function sembunyikanSaranPolisi() {
  const daftar = document.getElementById("saranNomorPolisi");
  const input = document.getElementById("nomorPolisi");

  if (daftar) {
    daftar.hidden = true;
    daftar.innerHTML = "";
  }
  if (input) input.setAttribute("aria-expanded", "false");
  pilihanSaranAktif = -1;
}

function pilihRekomendasiKendaraan(item) {
  const inputPolisi = document.getElementById("nomorPolisi");
  const inputTipe = document.getElementById("tipeMobil");
  const inputHP = document.getElementById("noHP");

  if (inputPolisi) inputPolisi.value = item.nomorPolisi;
  if (inputTipe && item.tipeMobil) inputTipe.value = item.tipeMobil;
  if (inputHP && item.noHP) inputHP.value = item.noHP;

  sembunyikanSaranPolisi();

  // Lanjutkan ke kolom biaya jika data kendaraan sudah dipilih.
  if (inputTipe) inputTipe.focus();
}

function tampilkanSaranPolisi(kataKunci) {
  const daftar = document.getElementById("saranNomorPolisi");
  const input = document.getElementById("nomorPolisi");
  if (!daftar || !input) return [];

  const kata = kataKunci.trim().toUpperCase();
  if (!kata) {
    sembunyikanSaranPolisi();
    return [];
  }

  const hasil = cacheKendaraan
    .filter(
      (item) =>
        item.nomorPolisi.includes(kata) ||
        String(item.tipeMobil).toUpperCase().includes(kata),
    )
    .slice(0, 8);

  daftar.innerHTML = "";
  pilihanSaranAktif = -1;

  if (hasil.length === 0) {
    const kosong = document.createElement("div");
    kosong.className = "autocomplete-empty";
    kosong.textContent = "Belum ada data kendaraan yang cocok";
    daftar.appendChild(kosong);
    daftar.hidden = false;
    input.setAttribute("aria-expanded", "true");
    return hasil;
  }

  hasil.forEach((item, index) => {
    const tombol = document.createElement("button");
    tombol.type = "button";
    tombol.className = "autocomplete-option";
    tombol.setAttribute("role", "option");

    const utama = document.createElement("span");
    utama.className = "autocomplete-plate";
    utama.textContent = item.nomorPolisi;

    const detail = document.createElement("span");
    detail.className = "autocomplete-detail";
    detail.textContent = [
      item.tipeMobil || "Tipe belum tersedia",
      item.noHP ? "HP: " + item.noHP : "",
    ]
      .filter(Boolean)
      .join(" • ");

    tombol.append(utama, detail);

    // pointerdown mencegah input kehilangan fokus sebelum data dipilih.
    tombol.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      pilihRekomendasiKendaraan(item);
    });

    tombol.addEventListener("mouseenter", () => {
      pilihanSaranAktif = index;
      tandaiSaranAktif();
    });

    daftar.appendChild(tombol);
  });

  daftar.hidden = false;
  input.setAttribute("aria-expanded", "true");
  return hasil;
}

function tandaiSaranAktif() {
  const daftar = document.getElementById("saranNomorPolisi");
  if (!daftar) return;

  daftar.querySelectorAll(".autocomplete-option").forEach((elemen, index) => {
    elemen.classList.toggle("aktif", index === pilihanSaranAktif);
  });
}

function aktifkanAutocompletePolisi() {
  const input = document.getElementById("nomorPolisi");
  const daftar = document.getElementById("saranNomorPolisi");
  if (!input || !daftar) return;

  input.addEventListener("input", () => {
    input.value = input.value.toUpperCase();
    tampilkanSaranPolisi(input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (daftar.hidden) return;

    const opsi = daftar.querySelectorAll(".autocomplete-option");

    if (event.key === "ArrowDown" && opsi.length) {
      event.preventDefault();
      pilihanSaranAktif = Math.min(pilihanSaranAktif + 1, opsi.length - 1);
      tandaiSaranAktif();
    } else if (event.key === "ArrowUp" && opsi.length) {
      event.preventDefault();
      pilihanSaranAktif = Math.max(pilihanSaranAktif - 1, 0);
      tandaiSaranAktif();
    } else if (event.key === "Enter" && opsi.length) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const index = pilihanSaranAktif >= 0 ? pilihanSaranAktif : 0;
      const item = cacheKendaraan
        .filter(
          (kendaraan) =>
            kendaraan.nomorPolisi.includes(input.value.trim().toUpperCase()) ||
            String(kendaraan.tipeMobil)
              .toUpperCase()
              .includes(input.value.trim().toUpperCase()),
        )
        .slice(0, 8)[index];

      if (item) pilihRekomendasiKendaraan(item);
    } else if (event.key === "Escape") {
      sembunyikanSaranPolisi();
    }
  });

  input.addEventListener("blur", () => {
    // Beri jeda kecil agar klik pilihan sempat diproses.
    setTimeout(sembunyikanSaranPolisi, 150);
  });

  document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest(".autocomplete-wrapper")) {
      sembunyikanSaranPolisi();
    }
  });
}

// ======================================================
// ENTER: PINDAH KE KOLOM BERIKUTNYA
// ======================================================

function aktifkanNavigasiEnter() {
  const nomorPolisi = document.getElementById("nomorPolisi");

  const tipeMobil = document.getElementById("tipeMobil");

  const biayaValet = document.getElementById("biayaValet");

  const noHP = document.getElementById("noHP");

  if (!nomorPolisi || !tipeMobil || !biayaValet || !noHP) {
    return;
  }

  // ----------------------------------------------------
  // NOMOR POLISI → ENTER → TIPE MOBIL
  // ----------------------------------------------------

  nomorPolisi.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    tipeMobil.focus();
  });

  // ----------------------------------------------------
  // TIPE MOBIL → ENTER → BIAYA VALET
  // ----------------------------------------------------

  tipeMobil.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    biayaValet.focus();
  });

  // ----------------------------------------------------
  // BIAYA VALET → ENTER → NO HP
  // ----------------------------------------------------

  biayaValet.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    noHP.focus();
  });

  // ----------------------------------------------------
  // NO HP → ENTER → SIMPAN
  // ----------------------------------------------------

  noHP.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    // Simpan nota
    await buatNota();
  });
}

// ======================================================
// ENTER PADA TOMBOL CETAK → PRINT
// ======================================================

function aktifkanEnterUntukCetak() {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }

    const elemenAktif = document.activeElement;

    if (
      elemenAktif &&
      elemenAktif.classList &&
      elemenAktif.classList.contains("btn-cetak")
    ) {
      event.preventDefault();

      window.print();
    }
  });
}

// ======================================================
// INISIALISASI
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  // --------------------------------------------------
  // Isi nomor nota pada form
  // --------------------------------------------------

  const noNota = document.getElementById("noNota");

  if (noNota) {
    noNota.value = await nomorNotaBerikutnya();
  }

  // --------------------------------------------------
  // Dashboard
  // --------------------------------------------------

  if (document.getElementById("totalSemua")) {
    await muatDashboard();
  }

  // --------------------------------------------------
  // Riwayat
  // --------------------------------------------------

  if (document.getElementById("tabelRiwayat")) {
    await muatRiwayat();
  }

  // --------------------------------------------------
  // Rekomendasi nomor polisi dari riwayat
  // --------------------------------------------------

  if (document.getElementById("nomorPolisi")) {
    aktifkanAutocompletePolisi();
    await muatDataRekomendasi();
  }

  // --------------------------------------------------
  // Navigasi Enter
  // --------------------------------------------------

  aktifkanNavigasiEnter();

  // --------------------------------------------------
  // Enter → Print
  // --------------------------------------------------

  aktifkanEnterUntukCetak();
});

// ======================================================
// EXPORT RIWAYAT KE EXCEL
// ======================================================

async function exportExcel() {
  // Ambil semua data dari database
  const riwayat = await ambilRiwayat();

  // Ambil filter yang sedang digunakan

  const kata =
    document.getElementById("cari")?.value?.trim().toLowerCase() || "";

  const tanggal = document.getElementById("cariTanggal")?.value || "";

  // Data yang akan diexport

  let data = riwayat;

  // ==================================================
  // FILTER NOMOR POLISI / TIPE MOBIL
  // ==================================================

  if (kata) {
    data = data.filter(
      (r) =>
        r.nomorPolisi.toLowerCase().includes(kata) ||
        r.tipeMobil.toLowerCase().includes(kata),
    );
  }

  // ==================================================
  // FILTER TANGGAL
  // ==================================================

  if (tanggal) {
    data = data.filter((r) => {
      if (!r.tanggalSumber) {
        return false;
      }

      const d = new Date(r.tanggalSumber);

      const tahun = d.getFullYear();

      const bulan = String(d.getMonth() + 1).padStart(2, "0");

      const hari = String(d.getDate()).padStart(2, "0");

      const tanggalLokal = `${tahun}-${bulan}-${hari}`;

      return tanggalLokal === tanggal;
    });
  }

  // ==================================================
  // PERIKSA HASIL
  // ==================================================

  if (data.length === 0) {
    alert("Tidak ada data yang bisa diexport.");

    return;
  }

  // ==================================================
  // SIAPKAN DATA EXCEL
  // ==================================================

  const dataExcel = data.map((item) => ({
    "No Nota": item.noNota,

    "No. Polisi": item.nomorPolisi,

    "Tipe Mobil": item.tipeMobil,

    "Tanggal Transaksi": item.tanggalTransaksi,

    "Waktu Masuk": item.waktuMasuk,

    "Biaya Valet": item.biayaValet,

    "No. HP": item.noHP || "-",
  }));

  // ==================================================
  // BUAT WORKSHEET
  // ==================================================

  const worksheet = XLSX.utils.json_to_sheet(dataExcel);

  // ==================================================
  // ATUR LEBAR KOLOM
  // ==================================================

  worksheet["!cols"] = [
    {
      wch: 12,
    },

    {
      wch: 18,
    },

    {
      wch: 18,
    },

    {
      wch: 25,
    },

    {
      wch: 15,
    },

    {
      wch: 28,
    },

    {
      wch: 18,
    },
  ];

  // ==================================================
  // BUAT WORKBOOK
  // ==================================================

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Valet");

  // ==================================================
  // NAMA FILE
  // ==================================================

  let namaFile = "Riwayat_Valet";

  if (tanggal) {
    namaFile += "_" + tanggal;
  }

  if (kata) {
    namaFile += "_" + kata.replace(/[^a-zA-Z0-9-_]/g, "_");
  }

  namaFile += ".xlsx";

  // ==================================================
  // DOWNLOAD EXCEL
  // ==================================================

  XLSX.writeFile(workbook, namaFile);
}

// ======================================================
// DASHBOARD MODERN - GRAFIK DAN STATISTIK
// ======================================================

let chartTransaksi = null;
let chartPendapatan = null;
let chartTipeMobil = null;

// ======================================================
// FORMAT RUPIAH
// ======================================================

function formatRupiahDashboard(angka) {
  return "Rp " + Number(angka || 0).toLocaleString("id-ID");
}

// ======================================================
// TANGGAL UNTUK DASHBOARD
// ======================================================

function tanggalDashboardLokal(tanggal) {
  const d = new Date(tanggal);

  const tahun = d.getFullYear();

  const bulan = String(d.getMonth() + 1).padStart(2, "0");

  const hari = String(d.getDate()).padStart(2, "0");

  return tahun + "-" + bulan + "-" + hari;
}

// ======================================================
// FORMAT TANGGAL PENDEK
// ======================================================

function formatTanggalPendekDashboard(tanggal) {
  const bagian = tanggal.split("-");

  if (bagian.length !== 3) {
    return tanggal;
  }

  return bagian[2] + "/" + bagian[1];
}

// ======================================================
// UPDATE TANGGAL DASHBOARD
// ======================================================

function updateTanggalDashboard() {
  const elemen = document.getElementById("dashboardTanggal");

  if (!elemen) {
    return;
  }

  const sekarang = new Date();

  elemen.textContent = formatTanggalIndonesia(sekarang);
}

// ======================================================
// BUAT GRAFIK DASHBOARD
// ======================================================

async function muatGrafikDashboard() {
  // Pastikan Chart.js sudah tersedia

  if (typeof Chart === "undefined") {
    console.error("Chart.js belum dimuat.");

    return;
  }

  const riwayat = await ambilRiwayat();

  // ==================================================
  // DATA 14 HARI TERAKHIR
  // ==================================================

  const sekarang = new Date();

  const tanggalHari = [];

  const jumlahTransaksi = [];

  const jumlahPendapatan = [];

  for (let i = 13; i >= 0; i--) {
    const tanggal = new Date(sekarang);

    tanggal.setHours(0, 0, 0, 0);

    tanggal.setDate(tanggal.getDate() - i);

    const key = tanggalDashboardLokal(tanggal);

    tanggalHari.push(key);

    let jumlah = 0;

    let pendapatan = 0;

    riwayat.forEach((item) => {
      if (!item.tanggalSumber) {
        return;
      }

      const keyData = tanggalDashboardLokal(item.tanggalSumber);

      if (keyData !== key) {
        return;
      }

      jumlah++;

      if (/free|gratis/i.test(item.biayaValet)) {
        return;
      }

      const angka = parseInt((item.biayaValet || "").replace(/[^0-9]/g, ""));

      if (!isNaN(angka)) {
        pendapatan += angka;
      }
    });

    jumlahTransaksi.push(jumlah);

    jumlahPendapatan.push(pendapatan);
  }

  // ==================================================
  // LABEL TANGGAL
  // ==================================================

  const labelTanggal = tanggalHari.map((tanggal) =>
    formatTanggalPendekDashboard(tanggal),
  );

  // ==================================================
  // GRAFIK TRANSAKSI
  // ==================================================

  const canvasTransaksi = document.getElementById("grafikTransaksi");

  if (canvasTransaksi) {
    if (chartTransaksi) {
      chartTransaksi.destroy();
    }

    chartTransaksi = new Chart(canvasTransaksi, {
      type: "bar",

      data: {
        labels: labelTanggal,

        datasets: [
          {
            label: "Jumlah Nota",

            data: jumlahTransaksi,

            borderWidth: 1,
          },
        ],
      },

      options: {
        responsive: true,

        maintainAspectRatio: false,

        plugins: {
          legend: {
            display: false,
          },
        },

        scales: {
          y: {
            beginAtZero: true,

            ticks: {
              precision: 0,
            },
          },
        },
      },
    });
  }

  // ==================================================
  // GRAFIK PENDAPATAN
  // ==================================================

  const canvasPendapatan = document.getElementById("grafikPendapatan");

  if (canvasPendapatan) {
    if (chartPendapatan) {
      chartPendapatan.destroy();
    }

    chartPendapatan = new Chart(canvasPendapatan, {
      type: "line",

      data: {
        labels: labelTanggal,

        datasets: [
          {
            label: "Pendapatan",

            data: jumlahPendapatan,

            borderWidth: 2,

            fill: true,

            tension: 0.3,
          },
        ],
      },

      options: {
        responsive: true,

        maintainAspectRatio: false,

        plugins: {
          legend: {
            display: false,
          },

          tooltip: {
            callbacks: {
              label: function (context) {
                return " " + formatRupiahDashboard(context.parsed.y);
              },
            },
          },
        },

        scales: {
          y: {
            beginAtZero: true,

            ticks: {
              callback: function (value) {
                return "Rp " + Number(value).toLocaleString("id-ID");
              },
            },
          },
        },
      },
    });
  }

  // ==================================================
  // TIPE MOBIL
  // ==================================================

  const tipeCounter = {};

  riwayat.forEach((item) => {
    const tipe = (item.tipeMobil || "LAINNYA").trim().toUpperCase();

    if (!tipeCounter[tipe]) {
      tipeCounter[tipe] = 0;
    }

    tipeCounter[tipe]++;
  });

  const tipeUrut = Object.entries(tipeCounter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const labelTipe = tipeUrut.map((item) => item[0]);

  const jumlahTipe = tipeUrut.map((item) => item[1]);
  const canvasTipe = document.getElementById("grafikTipeMobil");

  if (canvasTipe) {
    if (chartTipeMobil) {
      chartTipeMobil.destroy();
    }

    chartTipeMobil = new Chart(canvasTipe, {
      type: "doughnut",

      data: {
        labels: labelTipe,

        datasets: [
          {
            data: jumlahTipe,

            borderWidth: 1,
          },
        ],
      },

      options: {
        responsive: true,

        maintainAspectRatio: false,

        plugins: {
          legend: {
            position: "right",

            labels: {
              boxWidth: 12,

              font: {
                size: 11,
              },
            },
          },
        },
      },
    });
  }

  // ==================================================
  // SUMMARY
  // ==================================================

  let totalGratis = 0;

  let totalBerbayar = 0;

  let totalPendapatan = 0;

  riwayat.forEach((item) => {
    if (/free|gratis/i.test(item.biayaValet)) {
      totalGratis++;

      return;
    }

    totalBerbayar++;

    const angka = parseInt((item.biayaValet || "").replace(/[^0-9]/g, ""));

    if (!isNaN(angka)) {
      totalPendapatan += angka;
    }
  });

  const total = riwayat.length;

  const rataRata = totalBerbayar > 0 ? totalPendapatan / totalBerbayar : 0;

  // ==================================================
  // TAMPILKAN SUMMARY
  // ==================================================

  const summaryTotal = document.getElementById("summaryTotal");

  const summaryGratis = document.getElementById("summaryGratis");

  const summaryBerbayar = document.getElementById("summaryBerbayar");

  const summaryPendapatan = document.getElementById("summaryPendapatan");

  const summaryRataRata = document.getElementById("summaryRataRata");

  if (summaryTotal) {
    summaryTotal.textContent = total;
  }

  if (summaryGratis) {
    summaryGratis.textContent = totalGratis;
  }

  if (summaryBerbayar) {
    summaryBerbayar.textContent = totalBerbayar;
  }

  if (summaryPendapatan) {
    summaryPendapatan.textContent = formatRupiahDashboard(totalPendapatan);
  }

  if (summaryRataRata) {
    summaryRataRata.textContent = formatRupiahDashboard(Math.round(rataRata));
  }

  updateTanggalDashboard();
}

// ======================================================
// JALANKAN GRAFIK SETELAH HALAMAN SIAP
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {
  if (document.getElementById("grafikTransaksi")) {
    await muatGrafikDashboard();
  }
});
