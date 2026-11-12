"""Prepare the licensed Tokyo permit dataset. Never infer unavailable fields."""
from __future__ import annotations
import sys
import csv
import hashlib
import json
import re
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

BASE = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parent
SOURCE_URL = 'https://www.hokeniryo.metro.tokyo.lg.jp/kenkou/hokenjo_daicho/shokuhineigyokyokadaicho'
FILE_URL = 'https://www.hokeniryo.metro.tokyo.lg.jp/documents/d/hokeniryo/shokuhin-kyoka-9'
LICENSE_URL = 'https://spec.api.metro.tokyo.lg.jp/spec/t000055d0000000361-cc626c06e1fd5f5bbcd5b8a48781eb48-0'
DATE = '2026-09-30'
ACQUIRED = datetime.now(timezone.utc).isoformat(timespec='seconds')

def normalize(value: str) -> str:
    return re.sub(r'\s+', '', unicodedata.normalize('NFKC', value)).casefold()

def clean(value: str) -> str | None:
    value = re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', value)).strip()
    return value or None

def phone(value: str) -> str | None:
    value = re.sub(r'\D', '', unicodedata.normalize('NFKC', value))
    return value if re.fullmatch(r'0\d{9,10}', value) else None

def iso_date(value: str) -> str | None:
    try:
        return datetime.strptime(value.strip(), '%Y/%m/%d').date().isoformat()
    except ValueError:
        return None

def field_value(rows: list[dict], key: str):
    values = {}
    for row in rows:
        if clean(row[key]):
            values[normalize(row[key])] = clean(row[key])
    return next(iter(values.values())) if len(values) == 1 else None, len(values) > 1

with (BASE / 'tokyo-permits-2026-09-30.csv').open(encoding='cp932', newline='') as file:
    reader = csv.DictReader(file)
    columns = reader.fieldnames
    raw = [{**row, '_sourceLine': index} for index, row in enumerate(reader, 2)]

filtered = [row for row in raw if row['営業の種類'].startswith('飲食店営業')]
excluded = [row for row in filtered if not clean(row['屋号']) or not clean(row['営業所所在地'])]
valid = [row for row in filtered if clean(row['屋号']) and clean(row['営業所所在地'])]
groups = defaultdict(list)
for row in valid:
    groups[(normalize(row['屋号']), normalize(row['営業所所在地']))].append(row)

# Explicit official jurisdiction list; longest matches first avoid 東村山市 vs 村山市.
municipalities = sorted(['青梅市','福生市','羽村市','あきる野市','瑞穂町','日の出町','檜原村','奥多摩町','日野市','多摩市','稲城市','立川市','昭島市','国分寺市','国立市','東大和市','武蔵村山市','武蔵野市','三鷹市','府中市','調布市','小金井市','狛江市','小平市','東村山市','清瀬市','東久留米市','西東京市','大島町','利島村','新島村','神津島村','三宅村','御蔵島村','八丈町','青ヶ島村','小笠原村'], key=len, reverse=True)
public_records, private_records, evidences = [], [], []
for (normalized_name, normalized_address), rows in sorted(groups.items()):
    rid = 'tky-' + hashlib.sha256(('tokyo-permits\0' + normalized_name + '\0' + normalized_address).encode()).hexdigest()[:20]
    address = clean(rows[0]['営業所所在地'])
    municipality = next((value for value in municipalities if value in address), None)
    conflicts = []
    raw_phone, phone_conflict = field_value(rows, '営業所電話番号')
    if phone_conflict:
        conflicts.append('phone')
    normalized_phone = phone(raw_phone or '')
    if raw_phone and not normalized_phone:
        conflicts.append('invalidPhone')
    public = {
        'id': rid,
        'name': clean(rows[0]['屋号']),
        'nameKana': None,
        'postalCode': None,
        'prefecture': '東京都',
        'municipality': municipality,
        'address': address,
        'latitude': None,
        'longitude': None,
        'phone': raw_phone if normalized_phone else None,
        'phoneNormalized': normalized_phone,
        'category': '飲食店',
        'permitTypes': sorted({clean(row['営業の種類']) for row in rows}),
        'businessHours': None,
        'weeklyHolidays': None,
        'nearestStation': None,
        'businessStatus': '未確認',
        'openingDate': None,
        'businessFormat': None,
        'storeCount': None,
        'sourceName': '東京都保健医療局 食品関係営業台帳（許可）',
        'sourceUrl': SOURCE_URL,
        'sourceRecordDate': DATE,
        'acquiredAt': ACQUIRED,
        'checkedAt': ACQUIRED[:10],
        'verificationStatus': '公的台帳照合・営業状況未確認',
    }
    private = {'restaurantId': rid}
    for output_key, input_key in [('operatorName','営業者氏名'), ('operatorAddress','営業者住所'), ('operatorPhone','営業者電話番号'), ('representativeName','法人代表者氏名')]:
        value, conflict = field_value(rows, input_key)
        private[output_key] = value
        if conflict:
            conflicts.append(output_key)
    if 'operatorName' in conflicts:
        # Avoid combining a name from one operator with contact details of another.
        for key in ['operatorName','operatorAddress','operatorPhone','representativeName']:
            private[key] = None
    private.update({
        'corporateNumber': None,
        'representativeTitle': None,
        'decisionMakerName': None,
        'decisionMakerTitle': None,
        'decisionMakerAuthority': '未確認',
        'officialWebsite': None,
        'socialLinks': None,
        'salesInformation': None,
        'sourceUrl': SOURCE_URL,
        'sourceRecordDate': DATE,
        'checkedAt': ACQUIRED[:10],
    })
    evidence = {
        'restaurantId': rid,
        'sourceId': 'tokyo-food-permits-20260930',
        'sourceFileUrl': FILE_URL,
        'sourceRows': [row['_sourceLine'] for row in rows],
        'permitFirstDates': sorted({value for row in rows if (value := iso_date(row['初回許可日']))}),
        'permitApplicationTypes': sorted({row['申請区分'] for row in rows}),
        'conflicts': conflicts,
        'fieldEvidence': {
            key: {'sourceColumn': col, 'sourceDate': DATE, 'verification': 'source_record', 'visibility': visibility}
            for key, col, visibility in [('name','屋号','public'),('address','営業所所在地','public'),('phone','営業所電話番号','public'),('operatorName','営業者氏名','restricted'),('operatorAddress','営業者住所','restricted'),('operatorPhone','営業者電話番号','restricted'),('representativeName','法人代表者氏名','restricted')]
            if (public if visibility == 'public' else private).get(key)
        }
    }
    public_records.append(public)
    private_records.append(private)
    evidences.append(evidence)

def save(name, value):
    (BASE / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

save('restaurants-public.json', public_records)
save('restaurants-private.json', private_records)
save('restaurant-evidence.json', evidences)
with (BASE / 'restaurants-import.ndjson').open('w', encoding='utf-8', newline='\n') as output:
    for pub, prv, evidence in zip(public_records, private_records, evidences):
        output.write(json.dumps({'id': pub['id'], 'public': pub, 'private': prv, 'provenance': evidence}, ensure_ascii=False) + '\n')

summary = {
    'sourceName': '東京都保健医療局 食品関係営業台帳（許可）',
    'sourcePageUrl': SOURCE_URL, 'sourceFileUrl': FILE_URL, 'licenseCatalogUrl': LICENSE_URL,
    'license': 'CC BY (official catalog does not state a version)',
    'sourcePageUpdatedAt': '2026-10-15', 'sourceRecordDate': DATE, 'acquiredAt': ACQUIRED,
    'rawFileEncoding': 'CP932', 'columns': columns, 'allPermitRows': len(raw),
    'restaurantPermitRows': len(filtered), 'excludedMissingNameOrAddress': len(excluded),
    'validPermitRows': len(valid), 'uniqueFacilities': len(public_records),
    'duplicateRowsConsolidated': len(valid)-len(public_records),
    'groupsWithMultipleRows': sum(len(rows)>1 for rows in groups.values()),
    'recordsWithConflict': sum(bool(e['conflicts']) for e in evidences),
    'operatorNameConflicts': sum('operatorName' in e['conflicts'] for e in evidences),
    'publicPhoneCount': sum(bool(r['phone']) for r in public_records),
    'operatorNameCount': sum(bool(r['operatorName']) for r in private_records),
    'representativeNameCount': sum(bool(r['representativeName']) for r in private_records),
    'unrecognizedMunicipalityCount': sum(not r['municipality'] for r in public_records),
    'permitTypeCountsBeforeConsolidation': Counter(row['営業の種類'] for row in filtered),
    'municipalityCounts': Counter(r['municipality'] for r in public_records),
    'rawSha256': hashlib.sha256((BASE/'tokyo-permits-2026-09-30.csv').read_bytes()).hexdigest(),
}
save('acquisition-summary.json', summary)
save('excluded-row-indexes.json', [{'sourceLine':r['_sourceLine'],'reason':'name_or_address_not_published'} for r in excluded])
print(json.dumps({k:v for k,v in summary.items() if k not in ['columns','municipalityCounts','permitTypeCountsBeforeConsolidation']}, ensure_ascii=False, indent=2))

