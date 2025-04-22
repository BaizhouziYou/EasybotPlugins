/* EasyBot 插件,创建于 2025/3/16 03:37:18
 * 作者: bzzy1226
 * 描述: 有问题可通过邮箱connect@baizhouzi.top反馈,修复情况将通过邮箱返送至你发件的邮箱
 * 版本: 1.1.3
 * 项目ID: plugin_chicago
 * 该项目使用EasyBot插件编辑器创建，请勿直接复制、修改本代码。
 */
jsapi.addListener("robot_group_message", async (bot, ctx) => {
  const rawMsg = ctx.RawMessage.trim();
  if (!rawMsg.startsWith("自闭")) return;
  const content = rawMsg.slice(2).trim();
  const formatCheck = /^(?:\d+|0\.\d|\d+\.\d)$/.test(content);
  if (!formatCheck) {
    robot.Reply("格式错误：仅支持整数或x.x格式（如 5 或 1.5）");
    return;
  }
  let totalSeconds = 0;
  try {
    if (content.includes('.')) {
      const [minutesPart, secondsPart] = content.split('.');
      if (secondsPart.length !== 1) {
        robot.Reply("格式错误：小数点后仅允许1位数字");
        return;
      }
      const minutes = parseInt(minutesPart) || 0;
      const seconds = parseInt(secondsPart) * 6;
      totalSeconds = minutes * 60 + seconds;
    } else {
      totalSeconds = parseInt(content) * 60; 
    }
  } catch (e) {
    robot.Reply("时间格式解析错误");
    return;
  }
  const MAX_SECONDS = 29*86400 + 23*3600 + 59*60 + 59; 
  if (totalSeconds > MAX_SECONDS) {
    robot.Reply("禁言时间不能超过29天23时59分59秒");
    return;
  }
    await robot.Mute(ctx.PeerId, ctx.SenderId, totalSeconds);
    let remaining = totalSeconds;
    const days = Math.floor(remaining / 86400);
    remaining %= 86400;
    const hours = Math.floor(remaining / 3600);
    remaining %= 3600;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    let timeStr = "";
    if (days > 0) timeStr += `${days}天`;
    if (hours > 0) timeStr += `${hours}时`;
    if (minutes > 0) timeStr += `${minutes}分`;
    if (seconds > 0 || timeStr === "") timeStr += `${seconds}秒`;
    robot.Reply(`执行成功（未禁言成功可能是机器人权限不足）！已禁言时间：${timeStr}`);
});

function __manifest() {
  return {
    name: "自闭啸插件",
    id: "plugin_chicago",
    version: "1.1.3",
    description: "有问题可通过邮箱connect@baizhouzi.top反馈,修复情况将通过邮箱返送至你发件的邮箱",
    author: "bzzy1226",
  }
}
