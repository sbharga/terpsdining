import { Fragment, type ReactNode } from 'react'
import { hallMaps, mapTargets } from '../lib/hallMap'
import { linkClass } from '../lib/theme'

const MAN = 'M13 18 Q20 15 27 18 Q37 21 37 29 V51 Q37 55 34 55 Q31 55 31 51 V32 H29 V87 Q29 92 25 92 Q21 92 21 88 V58 H19 V88 Q19 92 15 92 Q11 92 11 87 V32 H9 V51 Q9 55 6 55 Q3 55 3 51 V29 Q3 21 13 18Z'
const WOMAN = 'M13 18 Q20 15 27 18 Q31 19 33 25 L40 49 Q41 53 38 54 Q35 55 34 51 L28 32 H27 L36 63 H27 V88 Q27 92 23.5 92 Q20.5 92 20.5 88 V63 H19 V88 Q19 92 15.5 92 Q12 92 12 88 V63 H4 L13 32 H12 L6 51 Q5 55 2 54 Q-1 53 0 49 L7 25 Q9 19 13 18Z'

const fixture = { fill: 'none', className: 'stroke-muted opacity-40', strokeWidth: 1 }
const shell = { fill: 'none', className: 'stroke-ink', strokeWidth: 2.5 }
const wall = { fill: 'none', className: 'stroke-muted', strokeWidth: 1 }
const gate = { className: 'fill-muted opacity-30' }
const treads = 'M0 0H74M0 6.6H74M0 13.2H74M0 19.8H74M0 26.4H74M0 33H74M0 39.6H74M0 46.2H74'

function Person({ woman, transform }: { woman?: boolean; transform: string }) {
  return <g transform={transform} className="fill-muted opacity-60"><circle cx="20" cy="8" r="7.5" /><path d={woman ? WOMAN : MAN} /></g>
}
function Label({ lines, x = 0, y = 0, size, anchor, transform }: { lines: string[]; x?: number; y?: number; size: number; anchor: 'start' | 'middle' | 'end'; transform?: string }) {
  return <text transform={transform} x={x} y={y} fontSize={size} textAnchor={anchor} className="fill-muted">{lines.map((line, n) => <tspan key={line} x={x} y={y + n * size}>{line}</tspan>)}</text>
}

const decors: Record<string, { under: ReactNode; over: ReactNode }> = {
  '251-north': {
    under: <>
      <path d="M958 10H1297V909H1207V1175H196V1180H150V1175H108V911H10V214H958Z" className="fill-surface-2" />
      <path d="M108 915H578V962H554V1139H511V1175H196V1180H150V1175H108Z" className="fill-surface" />
      <path d="M10 415H533V718H10M909 214V915M958 209H1297M117 915H140" {...fixture} />
      <path d="M106 214C110 262 173 306 249 317C299 324 343 317 361 291C374 273 373 251 356 232L333 252C351 269 330 286 299 289C232 296 143 256 137 214M322 214V231L343 214" {...fixture} />
      <path d="M435 915C442 866 359 820 295 811C244 803 205 809 187 830C173 847 179 872 195 893L224 884C214 868 203 857 213 849C250 821 352 847 397 889V896H317V915" {...fixture} />
      <rect x="648" y="405" width="14" height="312" {...fixture} />
      <path d="M662 426C686 403 715 402 737 415C779 438 792 496 784 558C774 645 729 724 662 721Z" {...fixture} />
      <path d="M648 439C606 516 602 601 648 703M662 466H682C698 466 708 453 708 441C708 423 683 404 666 421M708 438C748 445 761 504 752 563C748 598 736 634 719 662H681V641H662" {...fixture} />
      <path d="M958 81H1297" {...fixture} />
      <path d="M240 1121L234 1103C270 1088 299 1084 324 1104C347 1122 348 1144 337 1175M240 1121C267 1110 293 1106 307 1116C328 1130 325 1151 314 1175" {...fixture} />
      <path d="M810 1068V1030C828 1008 851 990 876 990C913 990 937 1024 937 1061C937 1096 922 1122 908 1154H950V1175M851 1175C883 1145 913 1090 911 1061C909 1036 896 1017 876 1017C852 1017 827 1041 810 1068" {...fixture} />
    </>,
    over: <>
      <path d="M108 914H7V211H954V7H1300V912H1210V1178H1168M1121 1178H196M150 1178H105V914" {...shell} />
      <path d="M108 915H118M140 915H1121M1166 915H1207M1127 10V146M187 915V1039M578 915V962M511 1175V1139H554V962H627M648 962H727M658 962V1175M747 962H851V993M757 962V1175" {...wall} />
      <path d="M137 1175V1100H151M195 1100H205M205 1175V1091L201 1080M1105 1175V1099H1120M1165 1099H1178V1175" {...wall} />
      <Person transform="translate(587 1014)" />
      <Person woman transform="translate(687 1014)" />
      <rect x="1114" y="999" width="17" height="48" {...gate} />
      <rect x="1160" y="999" width="17" height="48" {...gate} />
      <path d="M1144 894V1185" fill="none" className="stroke-muted" strokeWidth={2} />
      <path d="M0 0 21 51 0 35-21 51Z" className="fill-muted" transform="translate(1144 861)" />
      <path d="M0 0 21 51 0 35-21 51Z" className="fill-muted" transform="translate(1144 1217) rotate(180)" />
      <Label lines={['Dish Return']} x={879} y={251} size={30} anchor="end" />
      <Label lines={['Beverages']} size={30} anchor="start" transform="translate(603 492) rotate(90)" />
      <Label lines={['24 Shop']} x={358} y={1026} size={26} anchor="middle" />
    </>,
  },
  'south-campus': {
    under: <>
      <path d="M273 11H953V195H900V980H1291V587H1026V11H1535V513H1798V1141H1773V1145H1725V1144H1673V1146H1618V1144H1603V1146H1571V1141H1535V1395H1481V1400H1444V1395H1375V1418H1176V1521H1124V1526H1081V1524H1022V1526H978V1521H926V1418H439V1325H285V1141H238V1146H205V1144H189V1146H156V1144H120V1146H81V1144H65V1146H37V1141H11V513H273Z" className="fill-surface-2" />
      <path d="M343 321.5H419V589H343V978M830 200V1126" {...fixture} />
      <rect x="539" y="711" width="109" height="113" {...fixture} />
      <rect x="537" y="903" width="110" height="309" {...fixture} />
      <rect x="832.5" y="1202.5" width="70.5" height="102" {...fixture} />
      <path d="M439 1330.5H664.5V1418" {...fixture} />
      <path d="M1026 48C1109 48 1211 77 1211 146C1211 215 1123 245 1026 245" {...fixture} />
      <path d="M1027 355.5H1102V587" {...fixture} />
      <rect x="1286.5" y="559" width="79.5" height="29" {...fixture} />
      <rect x="976" y="1113" width="110" height="112.5" {...fixture} />
      <path d="M1375 1292V1263H1456.5V1292Z" {...fixture} />
    </>,
    over: <>
      <path d="M38 1144H7V510H269V8H957V198H904V976.5H1288V591H1022.5V8H1539.5V510H1802V1144H1773M238 1144H281V1329H435V1422H922V1525H977M1480 1398.5H1539.5V1144H1571M1444 1398.5H1375V1422H1180V1525H1125" {...shell} />
      <path d="M1149 1321.5H1181V1424" {...shell} />
      <path d="M411 199.5H342.5V588.5H268.5V1048M680 199.5H903M269 978H341.5V1075.5H279.5M256.5 1048H280V1141M905.5 979V1126H784" {...wall} />
      <path d="M108.5 513V522M108.5 553V728M11 650.5H108.5M11 766.5H108.5V1048M11 943.5H108.5M53 1048H63M98 1048H125M159 1048H173M208 1048H222" {...wall} />
      <path d="M1288 592H1386.5M1458 591H1541V978.5H1460M1288 978.5H1324" {...wall} />
      <path d="M1701 513V522.5M1701 560V723M1701 650H1798M1798 766H1701V809.5M1798 847H1703.5V1042.5H1664M1703.5 943.5H1798M1541 1042.5H1553M1580.5 1042.5H1595M1622.5 1042.5H1637.5M1746 1042.5H1756.5" {...wall} />
      <path d="M1537 1295H1375.5V1348M1375.5 1388V1396" {...wall} />
      <path d="M925 1423.5H976M1022 1423.5H1078.5M1126 1423.5H1177" {...wall} />
      <path d={treads} transform="translate(268.5 491.5)" {...wall} />
      <path d={treads} transform="translate(1469 491.5) scale(.974 1)" {...wall} />
      <path d={treads} transform="translate(1468.5 1032.5) scale(.979 1)" {...wall} />
      <path d="M268.5 513V541M1469 491V591M1541 512V541M1468.5 978.5V1079M1541 1025.5V1141" {...wall} />
      <Person woman transform="translate(35.5 530)" />
      <Person transform="translate(35.5 661)" />
      <Person woman transform="translate(1730 530)" />
      <Person transform="translate(1730 661)" />
      <Person transform="translate(1721 775) scale(.68)" />
      <Person woman transform="translate(1750 775) scale(.68)" />
      <rect x="925" y="1321" width="47" height="16.5" {...gate} />
      <rect x="925" y="1349" width="47" height="17" {...gate} />
      <rect x="925" y="1379" width="47" height="17" {...gate} />
      <g className="text-success">
        <path d="M1003.5 1425V1554" fill="none" stroke="currentColor" strokeWidth={2} />
        <path d="M0 0L21 51 0 34-21 51Z" fill="currentColor" transform="translate(1003.5 1390)" />
      </g>
      <g className="text-danger">
        <path d="M1104 1388.5V1524" fill="none" stroke="currentColor" strokeWidth={2} />
        <path d="M0 0L21 51 0 34-21 51Z" fill="currentColor" transform="translate(1104 1551.5) rotate(180) scale(.88)" />
      </g>
      <Label lines={['Breakfast', 'Bar']} x={381} y={517} size={30} anchor="start" />
      <Label lines={['Beverages']} x={310} y={1244} size={30} anchor="start" />
      <Label lines={['Soft Serve', 'Ice Cream']} x={594} y={1160} size={30} anchor="middle" />
      <Label lines={['Condiments']} x={1047} y={1184} size={30} anchor="middle" />
      <Label lines={['Plate Return']} x={625} y={47} size={30} anchor="middle" />
      <Label lines={['Beverages']} x={1292} y={554} size={26} anchor="start" />
      <Label lines={['Plate', 'Return']} x={1479} y={210} size={30} anchor="middle" />
      <Label lines={['Plate', 'Return']} x={1483} y={1142} size={30} anchor="middle" />
      <Label lines={['Infused Water', 'Station']} x={1416} y={1244} size={30} anchor="middle" />
    </>,
  },
  yahentamitsi: {
    under: <>
      <path d="M274 666H388V585H462V599L481 595V492H627V517L703 590L721 586H853V657H879V725L853 726V814H1208V720H1303V685H1344V443H1270V259H1702V1150H924V1057H274Z" className="fill-surface-2" />
      <rect x="445" y="909" width="17" height="64" className="fill-line" />
      <rect x="816" y="766" width="16" height="88" className="fill-line" />
      <rect x="773" y="801" width="18" height="74" className="fill-line" />
      <rect x="1552" y="606" width="18" height="75" className="fill-line" />
      <rect x="1368" y="755" width="16" height="113" className="fill-line" />
      <rect x="1237" y="874" width="45" height="15" className="fill-line" />
      <path d="M368 726H439V616H456M455 616V818H405" {...fixture} />
      <path d="M481 577H601V682H703V590M617 593V666H686V590H703" {...fixture} />
      <path d="M742 586V626L800 672H853M758 586V618L801 653H853" {...fixture} />
      <path d="M574 766H727V919H574ZM574 782H694V766M589 782V902H710V766" {...fixture} />
      <path d="M936 817V875H1023V880H1112V875H1191V817M936 833H951V859H1191" {...fixture} />
      <path d="M847 1057V1016H980V1000M864 1000V1016M905 1000V1016M928 1000V1016" {...fixture} />
      <path d="M1415 311V386L1426 397H1573L1584 386V311M1415 340H1430V381H1569V311" {...fixture} />
      <path d="M1344 443H1428V650L1413 665H1344M1344 456H1412V638Q1412 649 1403 649H1344" {...fixture} />
      <path d="M1421 874V859H1483V874M1506 874V859H1553V874M1417 874V956L1433 972H1544L1559 956V874M1433 950V886H1468V874M1516 874V885H1559M1542 950V907H1559" {...fixture} />
      <path d="M773 875V801H791M1552 606H1570V681H1552M1368 755H1384V868H1368M1237 874V889H1282V874M445 909H462V973H445" {...fixture} />
      <path d="M565 766H574M565 766V928H727V919M1584 368H1593V311" {...fixture} />
      {[[578, 722], [717.5, 722], [578, 1000], [717.5, 1000], [856.5, 1000], [996.5, 1000], [1135, 1000], [1274, 1000], [1413.5, 1000], [1552.5, 1000]].map(([x, y]) => <rect key={`${x} ${y}`} x={x} y={y} width="8" height="9.5" {...wall} />)}
    </>,
    over: <>
      <path d="M924 1069V1057H274V666H388V585H462V598L481 593V492H627V517L703 590L721 587H853V657H879V725L853 726V815H1208V720H1303V685H1344V443H1270V259H1702V1150H924V1134M924 1107V1098" {...shell} />
      <path d="M368.5 668V824H404.5V805M368.5 726H439M635 602H668M853.5 657V673M368.5 853V1013M368.5 862H444.5V1007.5H368.5M444.5 900.5H463M444.5 973.5H462M368.5 1041V1057" {...wall} />
      <path d="M773 765.5H791.5V875.5H773M816.5 725.5V766M816.5 725.5H853M816.5 854V875.5H904.5V835.5M904.5 815V823" {...wall} />
      <path d="M1414 262V310.5H1596V262M1552.5 439V693H1573M1552.5 591.5H1573M1414 730.5H1561M1369 730.5H1384M1369 730.5V884.5H1384" {...wall} />
      <path d="M1413.5 856.5V874.5H1561V856.5" {...wall} />
      <path d="M1208.5 815V885.5M1208.5 802.5H1278M1278 811.5V785.5H1286M1278 811.5H1286M1303.5 722V745.5H1344.5V718.5M1307 745.5V785.5M1300 785.5H1327.5M1340.5 785.5H1344.5V745.5M1300 811.5H1327.5M1340.5 811.5H1344.5V885.5M1305.5 811.5V885.5M1305.5 864.5H1344.5M1208.5 874H1305.5" {...wall} />
      <path d="M1004.5 1000V1057.5M924 1057.5H1080.5M1126.5 1057.5H1154M996.5 1057.5V1072M996.5 1101V1107M996.5 1136V1150M1228.5 1057.5H1282V1106H1228.5ZM1282 1106V1126.5M1282 1140V1150M1700 1011.5H1626.5V1024M1626.5 1038V1148" {...wall} />
      <Person woman transform="translate(1247 750) scale(.33)" />
      <Person transform="translate(1247 823) scale(.33)" />
      <Person woman transform="translate(1311 750) scale(.33)" />
      <Person transform="translate(1326 750) scale(.33)" />
      <Person woman transform="translate(1311 823) scale(.33)" />
      <Person transform="translate(1326 823) scale(.33)" />
      <rect x="1164" y="1030.5" width="8" height="23.5" {...gate} />
      <rect x="1187" y="1030.5" width="8" height="23.5" {...gate} />
      <rect x="1210" y="1030.5" width="8" height="23.5" {...gate} />
      <g className="text-success">
        <path d="M902 1121.5H1191V1058" fill="none" stroke="currentColor" strokeWidth={2} />
        <path d="M0 0 10 23 0 16-10 23Z" fill="currentColor" transform="translate(1191 1044)" />
      </g>
      <g className="text-danger">
        <path d="M1104.5 1042V1086H917" fill="none" stroke="currentColor" strokeWidth={2} />
        <path d="M0 0 10 23 0 16-10 23Z" fill="currentColor" transform="translate(904 1086) rotate(-90)" />
      </g>
      <Label lines={['Brew', '& Bubbles']} x={467} y={916} size={20} anchor="start" />
    </>,
  },
}

export function HallMap({ slug, title, stations, onJump }: {
  slug: string
  title: string
  stations: string[]
  onJump: (id: string) => void
}) {
  const targets = mapTargets(slug, stations)
  const plan = hallMaps[slug]
  const decor = decors[slug]
  if (!(plan && decor) && targets.others.length === 0) return null
  const jump = (id: string) => (event: { preventDefault: () => void }) => { event.preventDefault(); onJump(id) }
  return (
    <nav aria-label="Jump to a station" className="mt-6">
      {plan && decor && (
        <div className="-mx-4 overflow-x-auto px-safe sm:mx-0 sm:px-0">
          <svg viewBox={plan.viewBox} aria-label={title} className={`mx-auto block h-auto w-full font-sans [&_*]:[vector-effect:non-scaling-stroke] ${plan.widthClass}`}>
            <g aria-hidden="true" className="pointer-events-none">{decor.under}</g>
            {plan.areas.map(area => {
              const index = targets.areas.get(area.id)
              const size = area.size ?? plan.size
              const lines = area.lines.map((line, n) => <tspan key={line} x={area.x} y={area.y + n * size}>{line}</tspan>)
              if (index === undefined) return (
                <g key={area.id}>
                  <path d={area.shape} className="fill-surface stroke-line" strokeWidth={1} />
                  <text x={area.x} y={area.y} textAnchor={area.anchor} fontSize={size} className="fill-muted font-semibold">{lines}</text>
                </g>
              )
              return (
                <a key={area.id} href={`#station-${index}`} aria-label={area.lines.join(' ')} className="group" onClick={jump(`station-${index}`)}>
                  <path d={area.shape} className="fill-brand-soft stroke-brand transition group-hover:fill-brand/20 group-focus-visible:fill-brand/20" strokeWidth={1.5} />
                  {area.hit && <path d={area.hit} fill="transparent" />}
                  <text x={area.x} y={area.y} textAnchor={area.anchor} fontSize={size} className="fill-brand font-semibold">{lines}</text>
                </a>
              )
            })}
            <g aria-hidden="true" className="pointer-events-none">{decor.over}</g>
          </svg>
        </div>
      )}
      {targets.others.length > 0 && (
        <p className="mt-3 text-sm text-muted">Also: {targets.others.map((index, n) => <Fragment key={index}>{n > 0 && ', '}<a href={`#station-${index}`} onClick={jump(`station-${index}`)} className={linkClass}>{stations[index]}</a></Fragment>)}</p>
      )}
    </nav>
  )
}
