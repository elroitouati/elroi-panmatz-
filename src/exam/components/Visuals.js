import React, { useRef } from 'react';
import { View, Text, I18nManager } from 'react-native';
import Svg, { Line, Circle, Rect, Polygon, G, Defs, ClipPath, Path, Text as SvgText } from 'react-native-svg';
import { useX, font } from '../ui';
import { IS_RTL } from '../../design/rtl';

// ============================================================================
//  ציורים: תאי צורות, מטריצה, תרשימים, גלגלים/מנוף/גלגלות, סדרת מספרים.
//  הכול ב-SVG וקטורי — חד בכל גודל, צבע לפי המצב (בהיר/כהה).
// ============================================================================

const LTR_ROW = IS_RTL ? 'row-reverse' : 'row';
let uid = 0;

const ANG = (k) => (k * 45 * Math.PI) / 180; // 0 = למעלה, עם כיוון השעון
const P = (cx, cy, r, k) => [cx + r * Math.sin(ANG(k)), cy - r * Math.cos(ANG(k))];

export function FigureCell({ cell, size = 72, color }) {
  const { c } = useX();
  const ink = color || c.ink;
  const id = useRef(`c${++uid}`).current;
  if (!cell) return null;
  const sw = 5;
  let body = null;
  if (cell.t === 'spokes') {
    body = (
      <G>
        <Circle cx="50" cy="50" r="5" fill={ink} />
        {cell.s.map((k) => { const [x, y] = P(50, 50, 38, k); return <Line key={k} x1="50" y1="50" x2={x} y2={y} stroke={ink} strokeWidth={sw} strokeLinecap="round" />; })}
      </G>
    );
  } else if (cell.t === 'arrow' || cell.t === 'flag') {
    body = (
      <G rotation={cell.a * 45} origin="50, 50">
        <Line x1="50" y1="82" x2="50" y2="22" stroke={ink} strokeWidth={sw} strokeLinecap="round" />
        {cell.t === 'arrow'
          ? <Polygon points="50,12 36,32 64,32" fill={ink} />
          : <Polygon points="50,18 74,28 50,38" fill={ink} />}
        <Circle cx="50" cy="82" r="5" fill={ink} />
      </G>
    );
  } else if (cell.t === 'many') {
    const n = cell.n;
    const cols = n <= 4 ? 2 : 3;
    const rows = Math.ceil(n / cols);
    const gap = 26;
    const ox = 50 - ((cols - 1) * gap) / 2, oy = 50 - ((rows - 1) * gap) / 2;
    body = (
      <G>
        {Array.from({ length: n }, (_, i) => {
          const x = ox + (i % cols) * gap, y = oy + Math.floor(i / cols) * gap;
          if (cell.k === 'dot') return <Circle key={i} cx={x} cy={y} r="8" fill={ink} />;
          if (cell.k === 'square') return <Rect key={i} x={x - 8} y={y - 8} width="16" height="16" fill={ink} />;
          return <Polygon key={i} points={`${x},${y - 9} ${x - 9},${y + 8} ${x + 9},${y + 8}`} fill={ink} />;
        })}
      </G>
    );
  } else if (cell.t === 'shape') {
    const shape = (props) => cell.k === 'circle' ? <Circle cx="50" cy="50" r="30" {...props} />
      : cell.k === 'square' ? <Rect x="22" y="22" width="56" height="56" rx="4" {...props} />
      : <Polygon points="50,18 84,78 16,78" {...props} />;
    body = (
      <G>
        <Defs><ClipPath id={id}><Rect x="0" y="50" width="100" height="50" /></ClipPath></Defs>
        {cell.f === 'full' ? shape({ fill: ink }) : null}
        {cell.f === 'half' ? <G clipPath={`url(#${id})`}>{shape({ fill: ink })}</G> : null}
        {shape({ fill: 'none', stroke: ink, strokeWidth: sw, strokeLinejoin: 'round' })}
      </G>
    );
  } else if (cell.t === 'grid') {
    // רשת 3×3: משבצות שחורות לפי האינדקסים (שורה אחרי שורה, משמאל לימין)
    body = (
      <G>
        {Array.from({ length: 9 }, (_, i) => (
          <Rect key={i} x={17 + (i % 3) * 22} y={17 + Math.floor(i / 3) * 22} width="22" height="22" fill={cell.s.includes(i) ? ink : 'none'} stroke={ink} strokeWidth="2.5" />
        ))}
      </G>
    );
  } else if (cell.t === 'hands') {
    // שני מחוגים: ארוך עם נקודה בקצה, וקצר ועבה
    const [ax, ay] = P(50, 50, 36, cell.a), [bx, by] = P(50, 50, 22, cell.b);
    body = (
      <G>
        <Circle cx="50" cy="50" r="44" fill="none" stroke={c.mist} strokeWidth="2.5" />
        <Line x1="50" y1="50" x2={ax} y2={ay} stroke={ink} strokeWidth="4" strokeLinecap="round" />
        <Circle cx={ax} cy={ay} r="6" fill={ink} />
        <Line x1="50" y1="50" x2={bx} y2={by} stroke={ink} strokeWidth="8" strokeLinecap="round" />
        <Circle cx="50" cy="50" r="4.5" fill={c.surface} stroke={ink} strokeWidth="2" />
      </G>
    );
  } else if (cell.t === 'multi') {
    // 1–3 צורות בשורה; חצי מילוי = החצי השמאלי (חצי שטח גם במשולש)
    const sz = 22, gap = 30, x0 = 50 - ((cell.n - 1) * gap) / 2;
    body = (
      <G>
        <Defs>
          {Array.from({ length: cell.n }, (_, i) => (
            <ClipPath key={i} id={`${id}h${i}`}><Rect x={x0 + i * gap - sz} y="0" width={sz} height="100" /></ClipPath>
          ))}
        </Defs>
        {Array.from({ length: cell.n }, (_, i) => {
          const x = x0 + i * gap, y = 50, h = sz / 2;
          const shape = (props) => cell.k === 'circle' ? <Circle cx={x} cy={y} r={h} {...props} />
            : cell.k === 'square' ? <Rect x={x - h} y={y - h} width={sz} height={sz} {...props} />
            : <Polygon points={`${x},${y - h} ${x + h},${y + h} ${x - h},${y + h}`} {...props} />;
          return (
            <G key={i}>
              {cell.f === 'full' ? shape({ fill: ink }) : null}
              {cell.f === 'half' ? <G clipPath={`url(#${id}h${i})`}>{shape({ fill: ink })}</G> : null}
              {shape({ fill: 'none', stroke: ink, strokeWidth: 3.5, strokeLinejoin: 'round' })}
            </G>
          );
        })}
      </G>
    );
  } else if (cell.t === 'move') {
    // שמונה עמדות על שפת ריבוע (מלמעלה באמצע, עם כיוון השעון): עיגול שחור ועיגול ריק
    const pts = [[50, 14], [86, 14], [86, 50], [86, 86], [50, 86], [14, 86], [14, 50], [14, 14]];
    body = (
      <G>
        <Rect x="14" y="14" width="72" height="72" fill="none" stroke={c.steel} strokeWidth="2.5" />
        {pts.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r="2.4" fill={c.steel} />)}
        <Circle cx={pts[cell.a][0]} cy={pts[cell.a][1]} r="9.5" fill={ink} />
        <Circle cx={pts[cell.b][0]} cy={pts[cell.b][1]} r="8" fill={c.surface} stroke={ink} strokeWidth="3.5" />
      </G>
    );
  }
  return <Svg width={size} height={size} viewBox="0 0 100 100">{body}</Svg>;
}

export function Matrix({ cells, width = 300 }) {
  const { c } = useX();
  const cellW = width / 3;
  // קוראים משמאל לימין, כמו במבחן של תיל: התא הראשון למעלה משמאל, החסר — למטה מימין.
  // כל שורה נבנית בכיוון LTR מפורש, כדי שגם ממשק מימין לשמאל לא יהפוך אותה.
  return (
    <View style={{ width, alignSelf: 'center', backgroundColor: c.surface, borderRadius: 22, overflow: 'hidden' }}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={{ flexDirection: LTR_ROW }}>
          {[0, 1, 2].map((col) => {
            const i = row * 3 + col;
            return (
              <View key={col} style={{ width: cellW, height: cellW, alignItems: 'center', justifyContent: 'center',
                borderColor: c.mist, borderTopWidth: row ? 1 : 0, ...(col ? (IS_RTL ? { borderEndWidth: 1 } : { borderLeftWidth: 1 }) : null) }}>
                {i < 8 ? <FigureCell cell={cells[i]} size={cellW * 0.78} /> : <Text style={{ fontFamily: font.h, fontSize: 34, color: c.steel }}>?</Text>}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function Sequence({ items, notes, big = true, width = 340 }) {
  const { c } = useX();
  // גודל הספרות מותאם לאורך הסדרה — הסדרה תמיד בשורה אחת, בלי שבירה
  const n = items.length;
  const maxLen = Math.max(2, ...items.map((x) => String(x).length));
  const mh = n > 8 ? 3 : n > 6 ? 4 : 6;
  const fs = Math.max(13, Math.min(big ? 28 : 24, Math.floor((width - 24 - n * (2 * mh + 2)) / (n * maxLen * 0.62))));
  return (
    <View style={{ backgroundColor: c.surface, borderRadius: 22, paddingVertical: 26, paddingHorizontal: 10 }}>
      <View style={{ flexDirection: LTR_ROW, justifyContent: 'center', alignItems: 'flex-end', flexWrap: 'wrap', rowGap: 10 }}>
        {items.map((it, i) => {
          const q = it === '?' || it === '_';
          return (
            <View key={i} style={{ alignItems: 'center', marginHorizontal: mh }}>
              {q ? (
                <View style={{ width: fs * 1.2, height: fs * 1.2, borderBottomWidth: 3, borderColor: c.deep }} />
              ) : (
                <Text style={{ fontFamily: font.b, fontSize: fs, lineHeight: Math.round(fs * 1.22), color: c.ink, fontVariant: ['tabular-nums'] }}>
                  {it}
                  {/* פסיק בין המספרים, כמו במבחן — בלי פסיק "5 6 12" נקרא כמספר אחד */}
                  {i < n - 1 ? <Text style={{ color: c.steel }}>,</Text> : null}
                </Text>
              )}
            </View>
          );
        })}
      </View>
      {notes ? (
        <View style={{ flexDirection: LTR_ROW, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
          {notes.map((n, i) => (
            <Text key={i} style={{ fontFamily: font.b, fontSize: 16, color: c.steel, marginHorizontal: 10 }}>{n}</Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function ChartView({ chart, width = 320, height = 220 }) {
  if (chart.type === 'bars2') return <Bars2 chart={chart} width={width} height={height} />;
  return <SimpleChart chart={chart} width={width} height={height} />;
}

// שתי סדרות זו לצד זו. סדר עברי: התקופה הראשונה מימין. סדרה א׳ מלאה, סדרה ב׳ בהירה עם מסגרת.
function Bars2({ chart, width, height }) {
  const { c } = useX();
  const { values: [A, B], labels, title, step, series } = chart;
  const max = Math.ceil((Math.max(...A, ...B) + step) / step) * step;
  const L = 40, R = 8, T = 12, Bm = 30;
  const w = width - L - R, h = height - T - Bm;
  const n = labels.length, grp = w / n, bw = grp * 0.32;
  const gx = (i) => width - R - grp * (i + 0.5);
  const y = (v) => T + h - (v / max) * h;
  const ticks = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  const every = ticks.length > 8 ? 2 : 1;
  const sw = (fill, stroke) => <View style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: fill, borderWidth: stroke ? 1.5 : 0, borderColor: stroke }} />;
  return (
    <View style={{ backgroundColor: c.surface, borderRadius: 22, padding: 12, alignItems: 'center' }}>
      <Text style={{ fontFamily: font.b, fontSize: 16, color: c.ink, textAlign: 'center' }}>{title}</Text>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 6, marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>{sw(c.deep)}<Text style={{ fontFamily: font.m, fontSize: 14, color: c.slate }}>{series[0]}</Text></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>{sw(c.deepSoft, c.deep)}<Text style={{ fontFamily: font.m, fontSize: 14, color: c.slate }}>{series[1]}</Text></View>
      </View>
      <Svg width={width} height={height}>
        {ticks.map((v, k) => (
          <G key={v}>
            <Line x1={L} x2={width - R} y1={y(v)} y2={y(v)} stroke={v === 0 ? c.steel : c.mist} strokeWidth={1} />
            {k % every === 0 ? <SvgText x={L - 6} y={y(v) + 5} fontSize="12" fill={c.slate} textAnchor="end" fontFamily={font.m}>{v}</SvgText> : null}
          </G>
        ))}
        {labels.map((lb, i) => (
          <G key={i}>
            <Rect x={gx(i)} y={y(A[i])} width={bw} height={y(0) - y(A[i])} fill={c.deep} />
            <Rect x={gx(i) - bw} y={y(B[i])} width={bw} height={y(0) - y(B[i])} fill={c.deepSoft} stroke={c.deep} strokeWidth={1.5} />
            <SvgText x={gx(i)} y={height - 8} fontSize="12" fill={c.slate} textAnchor="middle" fontFamily={font.m}>{lb}</SvgText>
          </G>
        ))}
      </Svg>
    </View>
  );
}

function SimpleChart({ chart, width, height }) {
  const { c } = useX();
  const { values, labels, type, title, step } = chart;
  const max = Math.ceil((Math.max(...values) + step) / step) * step;
  const L = 40, R = 10, T = 14, B = 30;
  const w = width - L - R, h = height - T - B;
  const n = values.length;
  const x = (i) => L + (w / n) * (i + 0.5);
  const y = (v) => T + h - (v / max) * h;
  const ticks = [];
  const tickStep = max / step > 8 ? step * 2 : step;
  for (let v = 0; v <= max; v += step) ticks.push(v);
  return (
    <View style={{ backgroundColor: c.surface, borderRadius: 22, padding: 12, alignItems: 'center' }}>
      <Text style={{ fontFamily: font.b, fontSize: 16, color: c.ink, marginBottom: 6, textAlign: 'center' }}>{title}</Text>
      <Svg width={width} height={height}>
        {ticks.map((v) => (
          <G key={v}>
            <Line x1={L} x2={width - R} y1={y(v)} y2={y(v)} stroke={c.mist} strokeWidth={1} />
            {v % tickStep === 0 ? <SvgText x={L - 6} y={y(v) + 5} fontSize="13" fill={c.slate} textAnchor="end" fontFamily={font.m}>{v}</SvgText> : null}
          </G>
        ))}
        {type === 'bar'
          ? values.map((v, i) => <Rect key={i} x={x(i) - (w / n) * 0.3} y={y(v)} width={(w / n) * 0.6} height={T + h - y(v)} rx={4} fill={c.deep} />)
          : (
            <G>
              <Path d={values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')} stroke={c.deep} strokeWidth={3} fill="none" />
              {values.map((v, i) => <Circle key={i} cx={x(i)} cy={y(v)} r={5} fill={c.deep} />)}
            </G>
          )}
        {labels.map((lb, i) => <SvgText key={i} x={x(i)} y={height - 8} fontSize="13" fill={c.slate} textAnchor="middle" fontFamily={font.m}>{lb}</SvgText>)}
      </Svg>
    </View>
  );
}

function gearR(teeth) { return 16 + teeth * 0.9; }

export function TechDiagram({ d, width = 320 }) {
  const { c } = useX();
  if (!d) return null;
  if (d.type === 'gears') {
    const radii = d.teeth.map(gearR);
    const total = radii.reduce((s, r) => s + 2 * r, 0) - (radii.length - 1) * 4;
    const scale = Math.min(1, (width - 20) / total);
    const H = Math.max(...radii) * 2 * scale + 40;
    let xCur = width - 10; // הראשון מימין
    const centers = radii.map((r) => { const cx = xCur - r * scale; xCur = cx - r * scale + 4 * scale; return cx; });
    return (
      <View style={{ backgroundColor: c.surface, borderRadius: 22, paddingVertical: 10, alignItems: 'center' }}>
        <Svg width={width} height={H}>
          {radii.map((r, i) => {
            const cx = centers[i], cy = H / 2, rr = r * scale;
            const teethN = d.teeth[i];
            const circ = 2 * Math.PI * rr;
            return (
              <G key={i}>
                <Circle cx={cx} cy={cy} r={rr} fill="none" stroke={c.steel} strokeWidth={8} strokeDasharray={`${circ / teethN / 2} ${circ / teethN / 2}`} />
                <Circle cx={cx} cy={cy} r={rr - 6} fill={c.deepSoft} stroke={c.deep} strokeWidth={2} />
                {Array.isArray(d.labels) ? null : <Circle cx={cx} cy={cy} r={4} fill={c.deep} />}
                {i === 0 && d.first ? <SvgText x={cx} y={cy - rr - 4} fontSize="20" fontFamily={font.h} fill={c.deep} textAnchor="middle">{d.first === 'cw' ? '↻' : '↺'}</SvgText> : null}
                {i === d.ask && !d.labels ? <SvgText x={cx} y={cy + 7} fontSize="20" fontFamily={font.h} fill={c.deep} textAnchor="middle">?</SvgText> : null}
                {d.labels ? <SvgText x={cx} y={cy + 6} fontSize={Math.max(11, Math.min(16, rr * 0.5))} fontFamily={font.b} fill={c.deep} textAnchor="middle">{Array.isArray(d.labels) ? d.labels[i] : i === 0 ? 'א׳' : 'ב׳'}</SvgText> : null}
              </G>
            );
          })}
        </Svg>
      </View>
    );
  }
  if (d.type === 'lever2') {
    // מוט עם שני משקלים מימין למשען, וסימן שאלה משמאל
    const H = 150, mid = width / 2, beamY = 84;
    const maxD = Math.max(d.left, ...d.right.map((x) => x[1]));
    const unit = (width / 2 - 34) / maxD;
    const bw = Math.min(44, unit * 0.9); // תיבות צרות כשהמשקלים קרובים — שלא יעלו זו על זו
    const box = (x, label, dashed) => (
      <G>
        <Rect x={x - bw / 2} y={beamY - 44} width={bw} height={40} rx={6} fill={dashed ? 'none' : c.deep} stroke={c.deep} strokeWidth={dashed ? 2.5 : 0} strokeDasharray={dashed ? '6 4' : undefined} />
        <SvgText x={x} y={beamY - (dashed ? 16 : 19)} fontSize={dashed ? 20 : 13} fontFamily={dashed ? font.h : font.b} fill={dashed ? c.deep : c.onDeep} textAnchor="middle">{label}</SvgText>
      </G>
    );
    return (
      <View style={{ backgroundColor: c.surface, borderRadius: 22, paddingVertical: 10, alignItems: 'center' }}>
        <Svg width={width} height={H}>
          <Line x1={16} x2={width - 16} y1={beamY} y2={beamY} stroke={c.ink} strokeWidth={6} strokeLinecap="round" />
          <Polygon points={`${mid},${beamY + 3} ${mid - 17},${beamY + 34} ${mid + 17},${beamY + 34}`} fill={c.steel} />
          {d.right.map(([w, dist], i) => (
            <G key={i}>
              {box(mid + dist * unit, String(w))}
              <SvgText x={mid + dist * unit} y={beamY + 54} fontSize="13" fontFamily={font.m} fill={c.slate} textAnchor="middle">{`${dist} מ׳`}</SvgText>
            </G>
          ))}
          {box(mid - d.left * unit, '?', true)}
          <SvgText x={width * 0.8} y={beamY - 52} fontSize="12" fontFamily={font.m} fill={c.slate} textAnchor="middle">משקלים בק״ג</SvgText>
          <SvgText x={mid - d.left * unit} y={beamY + 54} fontSize="13" fontFamily={font.m} fill={c.slate} textAnchor="middle">{`${d.left} מ׳`}</SvgText>
        </Svg>
      </View>
    );
  }
  if (d.type === 'lever') {
    const H = 150, mid = width / 2, unit = (width / 2 - 40) / Math.max(d.d1, d.d2);
    const beamY = 80;
    const xw = mid + d.d1 * unit, xq = mid - d.d2 * unit;
    return (
      <View style={{ backgroundColor: c.surface, borderRadius: 22, paddingVertical: 10, alignItems: 'center' }}>
        <Svg width={width} height={H}>
          <Line x1={24} x2={width - 24} y1={beamY} y2={beamY} stroke={c.ink} strokeWidth={6} strokeLinecap="round" />
          <Polygon points={`${mid},${beamY + 3} ${mid - 18},${beamY + 36} ${mid + 18},${beamY + 36}`} fill={c.steel} />
          <Rect x={xw - 24} y={beamY - 46} width={48} height={42} rx={6} fill={c.deep} />
          <SvgText x={xw} y={beamY - 19} fontSize="15" fontFamily={font.b} fill={c.onDeep} textAnchor="middle">{d.w}</SvgText>
          <Rect x={xq - 24} y={beamY - 46} width={48} height={42} rx={6} fill="none" stroke={c.deep} strokeWidth={2.5} strokeDasharray="6 4" />
          <SvgText x={xq} y={beamY - 18} fontSize="20" fontFamily={font.h} fill={c.deep} textAnchor="middle">?</SvgText>
          <SvgText x={(mid + xw) / 2} y={beamY + 58} fontSize="15" fontFamily={font.m} fill={c.slate} textAnchor="middle">{`${d.d1} מ׳`}</SvgText>
          <SvgText x={(mid + xq) / 2} y={beamY + 58} fontSize="15" fontFamily={font.m} fill={c.slate} textAnchor="middle">{`${d.d2} מ׳`}</SvgText>
        </Svg>
      </View>
    );
  }
  if (d.type === 'pulley') {
    const H = 210, n = d.n;
    const cx = width / 2, top = 16, loadY = 150;
    const spread = 18;
    const xs = Array.from({ length: n }, (_, i) => cx - ((n - 1) * spread) / 2 + i * spread);
    return (
      <View style={{ backgroundColor: c.surface, borderRadius: 22, paddingVertical: 10, alignItems: 'center' }}>
        <Svg width={width} height={H}>
          <Line x1={cx - 70} x2={cx + 70} y1={top} y2={top} stroke={c.ink} strokeWidth={5} />
          <Circle cx={cx} cy={top + 30} r={Math.max(16, (n * spread) / 2 + 6)} fill="none" stroke={c.steel} strokeWidth={4} />
          <Line x1={cx} x2={cx} y1={top} y2={top + 16} stroke={c.ink} strokeWidth={3} />
          {xs.map((x, i) => <Line key={i} x1={x} x2={x} y1={top + 30} y2={loadY} stroke={c.deep} strokeWidth={3} />)}
          <Line x1={cx + Math.max(16, (n * spread) / 2 + 6)} x2={cx + Math.max(16, (n * spread) / 2 + 6) + 40} y1={top + 30} y2={loadY + 20} stroke={c.deep} strokeWidth={3} />
          <SvgText x={cx + Math.max(16, (n * spread) / 2 + 6) + 48} y={loadY + 40} fontSize="18" fontFamily={font.h} fill={c.deep} textAnchor="middle">F ?</SvgText>
          <Rect x={cx - 34} y={loadY} width={68} height={44} rx={6} fill={c.deep} />
          <SvgText x={cx} y={loadY + 28} fontSize="15" fontFamily={font.b} fill={c.onDeep} textAnchor="middle">{`${d.w} ק״ג`}</SvgText>
        </Svg>
      </View>
    );
  }
  return null;
}
