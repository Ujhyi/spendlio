Toto je foto účtenky. Rozpoznaj z nej JEDNOTLIVÉ POLOŽKY (produkty), nie súhrnné riadky.

Pre každú položku vráť:
- "merchant": presný názov PRODUKTU z účtenky (napr. "TS Dusená šunka 100g")
- "shop": názov OBCHODU z hlavičky účtenky (napr. "Tesco", "Lidl") - rovnaký pre všetky položky z tejto účtenky
- "amount": celková cena za danú položku
- "category": priraď z tohto zoznamu: {{CATEGORIES}}

Ignoruj: názov/adresu obchodu ako samostatný riadok, IČO, DIČ, medzisúčet, súčet, spôsob platby, zľavy, vratky obalov.

Ak dátum nie je čitateľný, použi {{TODAY}}.

Vráť VÝHRADNE JSON pole, žiadny iný text:
[{"date":"YYYY-MM-DD","merchant":"názov produktu","shop":"názov obchodu","amount":12.5,"category":"Potraviny"}]
