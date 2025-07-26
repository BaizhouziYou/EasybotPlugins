function __manifest() {
  return {
    name: "摩斯密码转换插件",
    id: "plugin_msct",
    version: "1.0.0",
    description: "支持中英文及大部分符号的摩斯码互转，包裹符也会被编码/解码",
    author: "bzzy",
    dependencies: ["EasyBot >= 2.0.0"]
  };
}

jsapi.addListener("robot_group_message", async (bot, ctx) => {
  const raw = ctx.RawMessage.trim();
  if (!raw.startsWith("ms ")) return;
  const text = raw.slice(3).trim();
  const [cmd, ...rest] = text.split(/\s+/);
  const input = rest.join(" ");

  const WRAP_CN = "※";
  const WRAP_EXT = "§";

  const morseMap = {
    A: ".-",    B: "-...",  C: "-.-.", D: "-..",  E: ".",    F: "..-.",
    G: "--.",   H: "....",  I: "..",   J: ".---", K: "-.-",  L: ".-..",
    M: "--",    N: "-.",    O: "---",  P: ".--.", Q: "--.-", R: ".-.",
    S: "...",   T: "-",     U: "..-",  V: "...-", W: ".--",  X: "-..-",
    Y: "-.--",  Z: "--..",
    "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
    "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
    ".": ".-.-.-",    ",": "--..--", "?": "..--..",  "'": ".----.",
    "!": "-.-.--",    "/": "-..-.",  "(": "-.--.",   ")": "-.--.-",
    "&": ".-...",     ":": "---...", ";": "-.-.-.",  "=": "-...-",
    "+": ".-.-.",     "-": "-....-", "_": "..--.-",  '"': ".-..-.",
    "$": "...-..-",   "@": ".--.-.", " ": "/",
    [WRAP_CN]: "...-.-",   // 自定义包裹中文符号
    [WRAP_EXT]: "-.-..-"   // 自定义包裹特殊符号
  };

  const reverseMap = Object.fromEntries(
    Object.entries(morseMap).map(([k, v]) => [v, k])
  );

  function toHex(c) {
    return c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
  }

  function fromHex(h) {
    return String.fromCodePoint(parseInt(h, 16));
  }

  function encodeMorse(str) {
    let out = [];
    for (let ch of str) {
      if (morseMap[ch]) {
        out.push(morseMap[ch]);
      } else if (/[\u4e00-\u9fa5]/.test(ch)) {
        const hex = toHex(ch).split("");
        out.push(morseMap[WRAP_CN]);
        hex.forEach(h => out.push(morseMap[h]));
        out.push(morseMap[WRAP_CN]);
      } else {
        const hex = toHex(ch).split("");
        out.push(morseMap[WRAP_EXT]);
        hex.forEach(h => out.push(morseMap[h]));
        out.push(morseMap[WRAP_EXT]);
      }
    }
    return out.join(" ");
  }

  function decodeMorse(str) {
    const tokens = str.trim().split(/\s+/);
    let res = "", i = 0;
    while (i < tokens.length) {
      const t = tokens[i];
      const ch = reverseMap[t];
      if (ch === WRAP_CN && i + 5 < tokens.length && reverseMap[tokens[i+5]] === WRAP_CN) {
        const hex = tokens.slice(i+1, i+5).map(m => reverseMap[m]).join("");
        res += fromHex(hex);
        i += 6;
      } else if (ch === WRAP_EXT && i + 5 < tokens.length && reverseMap[tokens[i+5]] === WRAP_EXT) {
        const hex = tokens.slice(i+1, i+5).map(m => reverseMap[m]).join("");
        res += fromHex(hex);
        i += 6;
      } else if (ch) {
        res += ch;
        i++;
      } else {
        i++;
      }
    }
    return res;
  }

  if (cmd === "en") {
    robot.Reply(`摩斯码：${encodeMorse(input)}`);
  } else if (cmd === "de") {
    robot.Reply(`明文：${decodeMorse(input)}`);
  } else {
    robot.Reply("格式错误：请使用 ms en <内容> 编码 或 ms de <摩斯码> 解码");
  }
});
