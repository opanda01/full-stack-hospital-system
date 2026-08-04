"""Mock entegrasyon istemcileri."""

from __future__ import annotations

from datetime import date
from uuid import uuid4

from app.core.config import get_settings
from app.core.tc_kimlik import gecerli_tc_kimlik_no
from app.integrations.ports import EnabizSonuc, KpsSonuc, MedulaSonuc


class MockEnabiz:
    def paket_gonder(self, payload: dict) -> EnabizSonuc:
        if get_settings().MOCK_ENTEGRASYON_FAIL:
            return EnabizSonuc(basarili=False, mesaj="MOCK_ENABIZ_FAIL")
        return EnabizSonuc(basarili=True, paket_id=f"ENB-{uuid4().hex[:12]}", mesaj="ok")

    def durum_sorgula(self, paket_id: str) -> EnabizSonuc:
        return EnabizSonuc(basarili=True, paket_id=paket_id, mesaj="SAGLIKLI")


class MockMedula:
    def provizyon_al(self, payload: dict) -> MedulaSonuc:
        if get_settings().MOCK_ENTEGRASYON_FAIL:
            return MedulaSonuc(basarili=False, mesaj="MOCK_MEDULA_FAIL")
        return MedulaSonuc(
            basarili=True,
            provizyon_no=f"PRV-{uuid4().hex[:10]}",
            takip_no=f"TKP-{uuid4().hex[:10]}",
            mesaj="ok",
        )

    def fatura_gonder(self, payload: dict) -> MedulaSonuc:
        if get_settings().MOCK_ENTEGRASYON_FAIL:
            return MedulaSonuc(basarili=False, mesaj="MOCK_MEDULA_FAIL")
        return MedulaSonuc(
            basarili=True,
            takip_no=payload.get("takip_no") or f"TKP-{uuid4().hex[:10]}",
            provizyon_no=payload.get("provizyon_no"),
            mesaj="GONDERILDI",
        )

    def sonuc_sorgula(self, takip_no: str) -> MedulaSonuc:
        return MedulaSonuc(basarili=True, takip_no=takip_no, mesaj="SAGLIKLI")


class MockKps:
    def dogrula(self, tc_kimlik_no: str) -> KpsSonuc:
        if get_settings().MOCK_ENTEGRASYON_FAIL:
            return KpsSonuc(dogrulandi=False, mesaj="MOCK_KPS_FAIL")
        if not gecerli_tc_kimlik_no(tc_kimlik_no):
            return KpsSonuc(dogrulandi=False, mesaj="Geçersiz TC formatı")
        return KpsSonuc(
            dogrulandi=True,
            ad="Mock",
            soyad="Kisi",
            dogum_tarihi=date(1990, 1, 1),
            mesaj="ok",
        )
