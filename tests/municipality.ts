import assert from 'node:assert/strict';
import {municipalityFromAddress} from '../lib/municipality';
for(const [address,prefecture,expected] of [
 ['東京都新宿区 市谷田町1-1 市場ビル','東京都','新宿区'],
 ['千葉県 市川市1-1','千葉県','市川市'],
 ['千葉県 市原市1-1','千葉県','市原市'],
 ['東京都東村山市1-1','東京都','東村山市'],
 ['東京都町田市1-1','東京都','町田市'],
 ['埼玉県比企郡小川町1-1','埼玉県','比企郡小川町'],
 ['神奈川県足柄下郡箱根町1-1','神奈川県','足柄下郡箱根町'],
 ['東京都 東京都港区1-1','東京都','港区'],
 ['東京都\u200b世田谷区1-1','東京都','世田谷区'],
 ['東京都大島町元町1-1','東京都','大島町'],
 ['東京都123','東京都','未確認']
])assert.equal(municipalityFromAddress(address,prefecture),expected,address);
console.log('PASS municipality extraction for wards, cities, counties, towns, spaces and invisible characters');
