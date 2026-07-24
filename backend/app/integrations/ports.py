"""Bakanlık entegrasyon portları."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Protocol


@dataclass
class KpsSonuc:
    dogrulandi: bool
    ad: str | None = None
    soyad: str | None = None
    dogum_tarihi: date | None = None
    mesaj: str | None = None


@dataclass
class EnabizSonuc:
    basarili: bool
    paket_id: str | None = None
    mesaj: str | None = None


@dataclass
class MedulaSonuc:
    basarili: bool
    takip_no: str | None = None
    provizyon_no: str | None = None
    mesaj: str | None = None


class EnabizPort(Protocol):
    def paket_gonder(self, payload: dict) -> EnabizSonuc: ...

    def durum_sorgula(self, paket_id: str) -> EnabizSonuc: ...


class MedulaPort(Protocol):
    def provizyon_al(self, payload: dict) -> MedulaSonuc: ...

    def fatura_gonder(self, payload: dict) -> MedulaSonuc: ...

    def sonuc_sorgula(self, takip_no: str) -> MedulaSonuc: ...


class KpsPort(Protocol):
    def dogrula(self, tc_kimlik_no: str) -> KpsSonuc: ...
