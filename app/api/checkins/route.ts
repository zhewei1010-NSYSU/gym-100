import { and, desc, eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { checkins } from "../../../db/schema";
export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) => Response.json(body, {status, headers: {"Cache-Control":"no-store"}});
const today = () => new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Taipei",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const validDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && s >= "2000-01-01" && s <= today() && !isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s;
export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json({error:"請先登入 ChatGPT，即可使用你的私人打卡本。"}, 401);
  try {
    const records = await getDb().select({id:checkins.id,date:checkins.date,note:checkins.note,createdAt:checkins.createdAt}).from(checkins).where(eq(checkins.userId,user.userId)).orderBy(desc(checkins.date),desc(checkins.createdAt),desc(checkins.id));
    return json({records});
  } catch (error) { console.error("讀取打卡失敗",error); return json({error:"暫時無法讀取紀錄，請稍後重試。"},503); }
}
export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({error:"請先登入 ChatGPT，再新增紀錄。"},401);
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return json({error:"請從打卡網站新增紀錄。"},403);
  let raw: unknown; try { raw=await request.json(); } catch { return json({error:"紀錄格式不正確。"},400); }
  if (!raw || typeof raw !== "object") return json({error:"紀錄格式不正確。"},400);
  const body = raw as Record<string,unknown>;
  if (!body || typeof body !== "object" || !validDate(body.date) || typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id) || typeof body.note !== "string" || body.note.length>120) return json({error:"請確認日期（不能晚於今天）與備註（最多 120 字）。"},400);
  try {
    const db = getDb();
    await db.insert(checkins).values({id:body.id,userId:user.userId,date:body.date,note:body.note.trim(),createdAt:new Date().toISOString()}).onConflictDoNothing();
    const [record]=await db.select({id:checkins.id,date:checkins.date,note:checkins.note,createdAt:checkins.createdAt}).from(checkins).where(and(eq(checkins.id,body.id),eq(checkins.userId,user.userId)));
    if (!record) return json({error:"請重試新增紀錄。"},409);
    return json({record},201);
  } catch (error) { console.error("新增打卡失敗",error); return json({error:"尚未儲存成功，請重試。"},503); }
}
export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({error:"請先登入 ChatGPT。"},401);
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return json({error:"請從打卡網站操作。"},403);
  const id=new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return json({error:"找不到這筆紀錄。"},400);
  try { await getDb().delete(checkins).where(and(eq(checkins.id,id),eq(checkins.userId,user.userId))); return json({ok:true}); }
  catch (error) {console.error("刪除打卡失敗",error); return json({error:"未能刪除，請重試。"},503);}
}
