// Tro ly Groq trong app — ban song song voi Tro ly Gemini (/api/agent).
// Cung chat tieng Viet, cung hieu du lieu THAT cua nguoi dung (thu chi,
// dinh ky, quy nhom, viec can lam) nho goi cong cu truy van Supabase bang
// phien cua chinh nguoi do (RLS). Chi khac nha cung cap: Groq
// (openai/gpt-oss-120b, goi kieu OpenAI-compatible), khoa nam trong bien
// moi truong GROQ_API_KEY tren Vercel, khong nam trong code. Groq cam ket
// khong dung du lieu de huan luyen mo hinh. Chi Nancy tu chon mo con nao:
// khi Gemini qua tai thi mo con Groq nay xai, khong tu dong chuyen.
import { createClient } from '@supabase/supabase-js';
import { fmtVND, todayISO, thisMonthRange, inRange, sumByType, calcHuiGroup } from '../../../lib/format';
import { isSettled } from '../../../lib/payments';
import { RECURRING_KIND_LABELS } from '../../../lib/recurring';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Model Groq moi nhat con dung duoc o goi free (2026-11-05). Llama-3.3
// bi Groq ngung phuc vu goi free tu 2026-08-16 nen doi sang con nay.
const MODEL = 'openai/gpt-oss-120b';

const SYSTEM = `Bạn là trợ lý trong app Gia Đình Nhỏ — app ghi thu chi, quỹ nhóm, định kỳ và việc cần làm của một gia đình.
Trả lời bằng tiếng Việt, ngắn gọn, dùng đúng tên mục trong app: Thu Chi, Quỹ Nhóm, Định kỳ, Việc cần làm, Tính nhanh, Ngân hàng, Báo cáo.
Bạn phải tự chủ: tự quyết định khi nào cần tra sổ, khi nào trả lời thẳng, khi nào hỏi lại — chỉ hỏi lại khi thông tin thiếu thật sự. Người dùng hỏi đủ thứ trên đời, không chỉ chuyện sổ sách.
QUY TẮC BẮT BUỘC:
- Chuyện trong sổ (tiền, hạn đóng, quỹ nhóm, việc cần làm): Mọi con số đều phải lấy từ công cụ, không được tự bịa. Chưa gọi công cụ thì chưa trả lời về số liệu. Nếu công cụ trả về rỗng thì nói là chưa có dữ liệu, đừng bịa.
- Chuyện ngoài sổ (kiến thức đời sống, tính toán, ngày giờ, giải thích...): trả lời thẳng bằng hiểu biết của bạn, ngắn gọn, đúng trọng tâm. Không biết thì nói không biết, đừng đoán mò.
- Tiền chờ xác nhận (lệnh chuyển khoản chưa chốt) phải tách riêng khỏi tiền đã chốt, và nói rõ là chưa chốt. Không bao giờ nói app xác minh được ngân hàng đã chuyển tiền — chỉ người dùng xác nhận mới tính là đã chuyển.
- Tiền trình bày kiểu Việt Nam, ví dụ 165.000đ. Ngày trình bày ngày/tháng/năm.
- Việc trong app ngoài công cụ (ghi khoản thu/chi, đóng kỳ, xóa dữ liệu, chuyển tiền...) thì nói rõ chưa làm được việc đó, hướng dẫn làm trong app hoặc nhờ trợ lý Muse ở ngoài.`;

const TOOLS = [
  { type: 'function', function: { name: 'xem_tong_quan', description: 'Tổng quan tiền tháng này, hôm nay, và lệnh chuyển khoản đang chờ xác nhận.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'xem_dinh_ky', description: 'Các khoản định kỳ (vay góp, lãi vay, hóa đơn): số tiền mỗi kỳ, ngày đến hạn, đã xử lý hay chưa trong tháng này.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'xem_quy_nhom', description: 'Các nhóm quỹ (hụi): đã đóng, đã hốt, còn phải đóng, lời/lỗ dự kiến.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'xem_viec_can_lam', description: 'Danh sách việc cần làm: việc nào chưa xong, việc nào xong rồi.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'them_viec', description: 'Ghi thêm một việc cần làm vào danh sách.', parameters: { type: 'object', properties: { text: { type: 'string', description: 'Nội dung việc cần làm' } }, required: ['text'] } } },
];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((new Date(dateStr + 'T00:00:00') - today) / 86400000);
}

async function runTool(name, args, sb, user) {
  if (name === 'xem_tong_quan') {
    const { data: txs } = await sb.from('transactions').select('date,amount,type,status');
    const { data: pays } = await sb.from('payments').select('amount,status');
    const settled = (txs || []).filter(isSettled);
    const month = thisMonthRange();
    const mTxs = settled.filter(t => inRange(t.date, month));
    const tTxs = settled.filter(t => t.date === todayISO());
    const pending = (pays || []).filter(p => p.status === 'pending');
    return {
      thang_nay: { thu: sumByType(mTxs, 'thu'), chi: sumByType(mTxs, 'chi'), con_lai: sumByType(mTxs, 'thu') - sumByType(mTxs, 'chi') },
      hom_nay: { thu: sumByType(tTxs, 'thu'), chi: sumByType(tTxs, 'chi') },
      cho_xac_nhan: { so_lenh: pending.length, tong_tien: pending.reduce((s, p) => s + Number(p.amount), 0) },
    };
  }
  if (name === 'xem_dinh_ky') {
    const { data: items } = await sb.from('recurring_items').select('*').order('next_due_date');
    const month = thisMonthRange();
    const { data: logs } = await sb.from('recurring_payments').select('recurring_item_id,paid_date')
      .gte('paid_date', month.from).lte('paid_date', month.to);
    const doneIds = new Set((logs || []).map(l => l.recurring_item_id));
    return (items || []).map(it => ({
      ten: it.name, loai: RECURRING_KIND_LABELS[it.kind] || it.kind,
      so_tien_moi_ky: Number(it.amount), ngay_den_han: it.next_due_date,
      con: daysUntil(it.next_due_date), da_xu_ly_thang_nay: doneIds.has(it.id),
    }));
  }
  if (name === 'xem_quy_nhom') {
    const { data: groups } = await sb.from('hui_groups').select('*');
    const { data: rounds } = await sb.from('hui_rounds').select('*');
    return (groups || []).map(g => {
      const c = calcHuiGroup(g, (rounds || []).filter(r => r.group_id === g.id));
      return { ten: g.name, da_dong: c.daDong, da_hot: c.daHot, con_phai_dong: c.conPhaiDong, loi_lo_du_kien: c.loiLoDuKien };
    });
  }
  if (name === 'xem_viec_can_lam') {
    const { data } = await sb.from('todos').select('text,done').order('done').order('created_at');
    return (data || []).map(t => ({ viec: t.text, xong: !!t.done }));
  }
  if (name === 'them_viec') {
    const text = String(args?.text || '').trim();
    if (!text) return { loi: 'Chưa có nội dung việc cần làm.' };
    const { error } = await sb.from('todos').insert({ user_id: user.id, text, done: false });
    if (error) return { loi: 'Không lưu được việc này: ' + error.message };
    return { da_ghi: text };
  }
  return { loi: 'Không có công cụ này.' };
}

export async function POST(req) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ reply: 'Trợ lý chưa gắn khóa Groq nên chưa trả lời được. Hãy gắn khóa GROQ_API_KEY trong cài đặt Vercel rồi thử lại.' }, { status: 503 });
  }
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /i, '');
  if (!token) {
    return Response.json({ reply: 'Bạn cần đăng nhập lại rồi hỏi lại nhé.' }, { status: 401 });
  }
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) {
    return Response.json({ reply: 'Phiên đăng nhập hết hạn rồi, bạn đăng nhập lại rồi hỏi lại nhé.' }, { status: 401 });
  }

  let body = {};
  try { body = await req.json(); } catch { body = {}; }
  const history = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  // Cho model biet hom nay la ngay may (gio Viet Nam) — neu khong no khong
  // tra loi duoc 'mai thu may', 'hom nay ngay bao nhieu' vi khong co moc thoi gian.
  const todayText = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Bangkok', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
  const systemWithDate = SYSTEM + `\nHôm nay là ${todayText} (giờ Việt Nam). Dùng mốc này để trả lời mọi câu hỏi về hôm nay / ngày mai / thứ mấy.`;
  const messages = [{ role: 'system', content: systemWithDate }, ...history.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')];

  for (let step = 0; step < 5; step++) {
    // Nha cung cap luc cao diem hay tra 503 tam thoi — tu thu lai toi da
    // 2 lan truoc khi bao loi. Tong cong toi da ~7 giay cho buoc nay.
    let res = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, attempt === 1 ? 1000 : 2000));
      try {
        res = await fetch(GROQ_URL, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: MODEL, messages, tools: TOOLS, tool_choice: 'auto', temperature: 0.2 }),
        });
      } catch {
        res = null;
      }
      if (res && res.status !== 503 && res.status !== 500 && res.status !== 502) break;
    }
    if (!res) return Response.json({ reply: 'Không gọi được Groq lúc này, bạn thử lại sau ít phút nhé.' }, { status: 502 });
    if (!res.ok) {
      if (res.status === 429) return Response.json({ reply: 'Hôm nay đã hết lượt miễn phí của Groq rồi, mai hỏi lại nhé.' }, { status: 429 });
      if (res.status === 401) return Response.json({ reply: 'Khóa Groq không dùng được nữa, cần gắn khóa mới trong cài đặt Vercel.' }, { status: 502 });
      if (res.status === 503) return Response.json({ reply: 'Groq đang quá tải lúc này, bạn thử lại sau ít phút nhé.' }, { status: 502 });
      return Response.json({ reply: 'Groq trả lỗi, bạn thử lại sau ít phút nhé.' }, { status: 502 });
    }
    const data = await res.json();
    const msg = data?.choices?.[0]?.message;
    if (!msg) return Response.json({ reply: 'Groq không trả lời, bạn thử lại nhé.' }, { status: 502 });
    messages.push(msg);
    const calls = msg.tool_calls || [];
    if (calls.length === 0) {
      return Response.json({ reply: msg.content || 'Mình chưa có câu trả lời cho việc này.' });
    }
    for (const call of calls) {
      let args = {};
      try { args = JSON.parse(call.function?.arguments || '{}'); } catch { args = {}; }
      const result = await runTool(call.function?.name, args, sb, user);
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }
  return Response.json({ reply: 'Câu này cần nhiều bước quá, bạn hỏi gọn lại giúp mình nhé.' });
}
