Rozparsuj text do JSON poľa. KAŽDÁ položka MUSÍ mať tieto polia:
- "date": dátum vo formáte YYYY-MM-DD, ak nie je uvedený použi ${today}
- "merchant": názov PRODUKTU alebo SLUŽBY (napr. "chlieb", "MHD lístok", "obed"), NIKDY názov obchodu
- "shop": názov OBCHODU/PREDAJNE, ak je v texte spomenutý (napr. "Tesco", "Lidl"). Ak nie je spomenutý, nechaj toto pole prázdny reťazec ""
- "amount": suma ako číslo (bez meny)
- "category": presne jedna z: ${CATEGORIES.join(', ')}

Príklad vstupu: "chlieb z tesca za 4 eura, MHD listok 1.20e"
Príklad výstupu:
[
  {"date":"${today}","merchant":"chlieb","shop":"Tesco","amount":4,"category":"Potraviny"},
  {"date":"${today}","merchant":"MHD lístok","shop":"","amount":1.2,"category":"Doprava"}
]

Vráť VÝHRADNE JSON pole, žiadny iný text.

Text na spracovanie:
${rawText}