Toto je foto účtenky. Rozpoznaj z nej JEDNOTLIVÉ POLOŽKY (produkty), nie súhrnné riadky.

Pre každú položku vráť:
- "merchant": presný názov PRODUKTU z účtenky (napr. "TS Dusená šunka 100g", "Heineken 0,5l pl VO"), NIE názov obchodu
- "amount": celková cena za danú položku (ak je uvedené množstvo × jednotková cena, použi výsledný súčet, nie jednotkovú cenu)
- "category": priraď z tohto zoznamu: {{CATEGORIES}}

Ignoruj tieto riadky, nevytváraj z nich položky:
- Názov a adresu obchodu, IČO, DIČ
- Medzisúčet, súčet, "NA ÚHRADU", spôsob platby (karta/hotovosť)
- Zľavy, úspory, vratky obalov a podobné korekčné riadky (napr. "CC ...", "celková úspora")

Ak dátum na účtenke nie je čitateľný, použi {{TODAY}}. Ak sú položky úplne nečitateľné, vráť aspoň jeden záznam s celkovou sumou z účtenky a s "merchant" ako názov obchodu.

Vráť VÝHRADNE JSON pole, žiadny iný text, v tomto formáte:
[{"date":"YYYY-MM-DD","merchant":"názov produktu","amount":12.5,"category":"Potraviny"}]