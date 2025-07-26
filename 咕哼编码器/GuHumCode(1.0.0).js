function __manifest() {
  return {
    name: "咕哼编码器",
    id: "plugin_ghc",
    version: "1.0.0",
    description: "使用一组特殊字符对任意文本进行编码和解码，支持中文、英文及符号(效果与 https://msbt.seku.su/ 相同)",
    author: "bzzy",
    dependencies: ["EasyBot >= 2.0.0"]
  };
}

jsapi.addListener("robot_group_message", async (bot, ctx) => {
  const raw = ctx.RawMessage.trim();
  if (!raw.startsWith("ghc ")) return;

  const text = raw.slice(4).trim();
  const [cmd, ...rest] = text.split(/\s+/);
  const input = rest.join(" ");

  const codebook = ['齁','哦','噢','喔','咕','咿','嗯','啊','～','哈','！','唔','哼','❤','呃','呼'];
  const codebookMap = {};
  for (let i = 0; i < codebook.length; i++) {
    codebookMap[codebook[i]] = i;
  }

  function utf8Encode(str) {
    let out = [];
    for (let i = 0; i < str.length; i++) {
      let code = str.charCodeAt(i);
      if (code < 0x80) {
        out.push(code);
      } else if (code < 0x800) {
        out.push(0xc0 | (code >> 6));
        out.push(0x80 | (code & 0x3f));
      } else if (code < 0x10000) {
        out.push(0xe0 | (code >> 12));
        out.push(0x80 | ((code >> 6) & 0x3f));
        out.push(0x80 | (code & 0x3f));
      } else {
        // surrogate pair (not strictly needed unless emojis)
        out.push(0xf0 | (code >> 18));
        out.push(0x80 | ((code >> 12) & 0x3f));
        out.push(0x80 | ((code >> 6) & 0x3f));
        out.push(0x80 | (code & 0x3f));
      }
    }
    return out;
  }

  function utf8Decode(bytes) {
    let str = "", i = 0;
    while (i < bytes.length) {
      let byte1 = bytes[i++];
      if (byte1 < 0x80) {
        str += String.fromCharCode(byte1);
      } else if (byte1 < 0xe0) {
        let byte2 = bytes[i++];
        str += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f));
      } else if (byte1 < 0xf0) {
        let byte2 = bytes[i++];
        let byte3 = bytes[i++];
        str += String.fromCharCode(((byte1 & 0x0f) << 12) |
                                   ((byte2 & 0x3f) << 6) |
                                   (byte3 & 0x3f));
      } else {
        let byte2 = bytes[i++];
        let byte3 = bytes[i++];
        let byte4 = bytes[i++];
        let code = ((byte1 & 0x07) << 18) |
                   ((byte2 & 0x3f) << 12) |
                   ((byte3 & 0x3f) << 6) |
                   (byte4 & 0x3f);
        code -= 0x10000;
        str += String.fromCharCode(0xD800 + ((code >> 10) & 0x3FF));
        str += String.fromCharCode(0xDC00 + (code & 0x3FF));
      }
    }
    return str;
  }

  function encode(str) {
    const bytes = utf8Encode(str);
    let out = '';
    for (let b of bytes) {
      out += codebook[(b >> 4) & 0x0F] + codebook[b & 0x0F];
    }
    return out;
  }

  function decode(str) {
    if (str.length % 2 !== 0) throw new Error("输入长度必须为偶数");
    const bytes = [];
    for (let i = 0; i < str.length; i += 2) {
      const hi = codebookMap[str[i]];
      const lo = codebookMap[str[i+1]];
      if (hi === undefined || lo === undefined) {
        throw new Error("包含非法字符");
      }
      bytes.push((hi << 4) | lo);
    }
    return utf8Decode(bytes);
  }

  try {
    if (cmd === "en") {
      const res = encode(input);
      robot.Reply(`编码结果：${res}`);
    } else if (cmd === "de") {
      const res = decode(input);
      robot.Reply(`解码结果：${res}`);
    } else {
      robot.Reply("用法：ghc en <文本> 或 ghc de <编码>");
    }
  } catch (e) {
    robot.Reply(`错误：${e.message}`);
  }
});
