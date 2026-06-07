const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

// ===============================
// EXPRESS SERVER (RENDER)
// ===============================

const app = express();

app.get("/", (req, res) => {
res.send("Big Deal Bot Running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
console.log("Server running on port ${PORT}");
});

// ===============================
// CLIENT
// ===============================

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
});

const PREFIX = "!";

// ===============================
// DATABASE
// ===============================

let db = { users: {} };

if (fs.existsSync("./database.json")) {
db = JSON.parse(fs.readFileSync("./database.json"));
}

function saveDB() {
fs.writeFileSync(
"./database.json",
JSON.stringify(db, null, 2)
);
}

function getUser(id) {

if (!db.users[id]) {

db.users[id] = {
  bank: 0,
  holding: 0,
  daily: 0,
  pending: 0
};

saveDB();

}

return db.users[id];
}

// ===============================
// READY
// ===============================

client.once("ready", () => {
console.log("🔥 Big Deal Bot Ready");
});

// ===============================
// AUTO SAVE
// ===============================

setInterval(() => {
saveDB();
}, 30000);

// ===============================
// COMMAND HANDLER
// ===============================

client.on("messageCreate", async (message) => {

if (message.author.bot) return;

if (!message.content.startsWith(PREFIX))
return;

const args = message.content
.slice(PREFIX.length)
.trim()
.split(/ +/);

const command =
args.shift().toLowerCase();

// ==========================
// PING
// ==========================

if (command === "ping") {

return message.reply(
  "🏓 Pong!"
);

}

// ==========================
// HELP
// ==========================

if (command === "help") {

return message.reply(`

📌 BIG DEAL BOT

!ping
!help
!balance
!daily
!leaderboard
!status
!qr

More commands available...
`);
}

// ==========================
// BALANCE
// ==========================

if (
command === "balance" ||
command === "bal"
) {

const user =
  getUser(message.author.id);

return message.reply(`

🏦 Bank: ${user.bank}
💎 Holding: ${user.holding}
`);
}

// ==========================
// DAILY
// ==========================

if (command === "daily") {

const user =
  getUser(message.author.id);

const now = Date.now();

if (
  now - user.daily <
  86400000
) {

  return message.reply(
    "⏳ Daily already claimed."
  );
}

user.bank += 500;

user.daily = now;

saveDB();

return message.reply(
  "🎁 You received 500 BIGPAY!"
);

  }// ==========================
// MONEY ADD / REMOVE
// ==========================

if (command === "money") {

const action = args[0];

const targetUser =
message.mentions.users.first();

const amount =
parseInt(args[2]);

if (!targetUser)
return message.reply(
"❌ Mention a user."
);

if (
isNaN(amount) ||
amount <= 0
)
return message.reply(
"❌ Invalid amount."
);

const target =
getUser(targetUser.id);

if (action === "add") {

target.holding += amount;

saveDB();

return message.reply(
  `✅ Added ${amount} BIGPAY to ${targetUser.username}`
);

}

if (action === "remove") {

if (
  target.holding < amount
) {
  return message.reply(
    "❌ Not enough holding."
  );
}

target.holding -= amount;

saveDB();

return message.reply(
  `✅ Removed ${amount} BIGPAY from ${targetUser.username}`
);

}
}

// ==========================
// WITHDRAW
// ==========================

if (command === "withdraw") {

const amount =
parseInt(args[0]);

if (
isNaN(amount) ||
amount <= 0
) {
return message.reply(
"❌ Invalid amount."
);
}

const user =
getUser(message.author.id);

if (user.bank < amount) {

return message.reply(
  "❌ Not enough balance."
);

}

user.pending = amount;

saveDB();

return message.reply(
"💸 Withdraw request created for ${amount} BIGPAY"
);
}

// ==========================
// LEADERBOARD
// ==========================

if (
command === "leaderboard" ||
command === "lb"
) {

const sorted =
Object.entries(db.users)
.sort(
(a, b) =>
(b[1].bank + b[1].holding) -
(a[1].bank + a[1].holding)
)
.slice(0, 10);

let text =
"🏆 BIG DEAL LEADERBOARD\n\n";

sorted.forEach(
([id, data], index) => {

  text +=
    `${index + 1}. <@${id}> - ${data.bank + data.holding}\n`;
}

);

return message.reply(text);
}

// ==========================
// STATUS
// ==========================

if (command === "status") {

return message.reply(`
🤖 BIG DEAL BOT

✅ Online
🏦 Economy Active
💸 Withdraw Active
🏆 Leaderboard Active
`);
}

// ==========================
// QR COMMAND
// ==========================

if (command === "qr") {

const amount =
parseInt(args[0]);

if (
isNaN(amount) ||
amount <= 0
) {
return message.reply(
"❌ Enter amount."
);
}

return message.reply(
`UPI Payment

UPI ID:
yourupi@upi

Amount:
₹${amount}`
);
}

});

// ==========================
// LOGIN
// ==========================

client.login(
process.env.TOKEN
);
