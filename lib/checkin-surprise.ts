// Draw without replacement so every message gets a turn before the deck resets.
const messages = [
  "今天的你，替未來的自己存了一點底氣。",
  "不必每天突破紀錄，願意出現就值得記一筆。",
  "進步有時很安靜，但你今天的努力沒有白費。",
  "把目標拆成一次一次，你已經完成了這一次。",
  "今天流下的汗，是送給自己的小小掌聲。",
  "走得慢也沒關係，你正在走自己的路。",
  "不用跟別人比，你的每一步都有自己的重量。",
  "能認真運動，也能好好休息，都是照顧自己。",
  "今天的任務完成了，記得也對自己溫柔一點。",
  "你不需要等到很有動力，才值得為今天的行動驕傲。",
  "一百次是方向，今天這一次就是實實在在的進步。",
  "你的努力不是限時優惠，慢慢累積也一直有效。",
  "啞鈴為什麼不愛聊天？因為它怕一開口就變成抬槓。",
  "今天最有毅力的隊友是誰？你的水壺，從頭陪你撐到尾。",
  "跑步機最擅長什麼？讓人很努力，卻一直原地踏步。",
  "我的運動計畫很有彈性，瑜伽墊聽了都想拜我為師。",
  "槓片的交友條件很簡單：希望對方能把它放在心上，練完放回架上。",
  "今天和沙發的拔河比賽，你贏了。沙發表示：下次再戰。",
  "深蹲時最忙的是誰？褲子的接縫，每一下都在努力上班。",
  "健身房裡最穩定的關係：我和水壺，每組之間都要見一面。",
  "我問肌肉有沒有收到訓練通知，它說：收到，明天回覆。",
  "運動完最適合聽什麼音樂？掌聲，先自己拍兩下也算。",
  "為什麼瑜伽墊很會保守秘密？因為它總是把事情捲起來。",
  "今天的待辦清單少了一項，成就感卻多了一組。",
] as const;

export function createSurpriseDeck() {
  let remaining: string[] = [];
  let previous = "";
  return () => {
    if (!remaining.length) {
      remaining = [...messages];
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }
      if (remaining[remaining.length - 1] === previous) {
        [remaining[0], remaining[remaining.length - 1]] = [remaining[remaining.length - 1], remaining[0]];
      }
    }
    previous = remaining.pop()!;
    return previous;
  };
}
