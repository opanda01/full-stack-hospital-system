"""Live istemci iskeleti — kimlik/WSDL olmadan NotImplemented."""

from __future__ import annotations

from app.integrations.ports import EnabizSonuc, KpsSonuc, MedulaSonuc


class LiveEnabiz:
    def paket_gonder(self, payload: dict) -> EnabizSonuc:
        raise NotImplementedError("ENTEGRASYON_BACKEND=live: e-Nabız henüz bağlanmadı")

    def durum_sorgula(self, paket_id: str) -> EnabizSonuc:
        raise NotImplementedError("ENTEGRASYON_BACKEND=live: e-Nabız henüz bağlanmadı")


class LiveMedula:
    def provizyon_al(self, payload: dict) -> MedulaSonuc:
        raise NotImplementedError("ENTEGRASYON_BACKEND=live: MEDULA henüz bağlanmadı")

    def fatura_gonder(self, payload: dict) -> MedulaSonuc:
        raise NotImplementedError("ENTEGRASYON_BACKEND=live: MEDULA henüz bağlanmadı")

    def sonuc_sorgula(self, takip_no: str) -> MedulaSonuc:
        raise NotImplementedError("ENTEGRASYON_BACKEND=live: MEDULA henüz bağlanmadı")


class LiveKps:
    def dogrula(self, tc_kimlik_no: str) -> KpsSonuc:
        raise NotImplementedError("ENTEGRASYON_BACKEND=live: KPS henüz bağlanmadı")
