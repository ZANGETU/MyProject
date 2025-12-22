require('dotenv').config();
const fs = require('fs');
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  ChannelType,
  MessageFlags
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const FILE = './settings.json';
let settings = fs.existsSync(FILE)
  ? JSON.parse(fs.readFileSync(FILE, 'utf8'))
  : {};

function saveSettings() {
  fs.writeFileSync(FILE, JSON.stringify(settings, null, 2));
}

function getGuildSetting(guildId) {
  if (!settings[guildId]) {
    settings[guildId] = {
      channels: {},
      logChannel: null,
      bypassRoles: []
    };
  }
  return settings[guildId];
}

function getChannelSetting(guildId, channelId) {
  const guild = getGuildSetting(guildId);
  if (!guild.channels[channelId]) {
    guild.channels[channelId] = {
      youtube: false,
      discord: false,
      short: false,
      custom: []
    };
  }
  return guild.channels[channelId];
}

const YOUTUBE_DOMAINS = ['youtube.com', 'youtu.be'];
const DISCORD_DOMAINS = ['discord.gg', 'discord.com'];
const SHORT_DOMAINS = ['bit.ly', 't.co', 'tinyurl.com', 'is.gd', 'buff.ly'];

function extractUrls(text) {
  return text.match(/https?:\/\/[^\s]+/gi) || [];
}

function normalizeDomain(input) {
  try {
    const url = new URL(input.startsWith('http') ? input : `https://${input}`);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function matchDomain(host, domains) {
  return domains.some(d => host === d || host.endsWith(`.${d}`));
}

const command = new SlashCommandBuilder()
  .setName('linkblock')
  .setDescription('リンクブロック設定')
  .setDMPermission(false)
  .addSubcommand(s =>
    s.setName('channel')
      .setDescription('このチャンネルの監視ON/OFF')
      .addStringOption(o =>
        o.setName('mode')
          .setDescription('on / off')
          .setRequired(true)
          .addChoices(
            { name: 'ON', value: 'on' },
            { name: 'OFF', value: 'off' }
          )
      )
  )
  .addSubcommand(s =>
    s.setName('channel_list')
      .setDescription('監視中チャンネル一覧')
  )
  .addSubcommand(s => s.setName('youtube').setDescription('YouTube切替'))
  .addSubcommand(s => s.setName('discord').setDescription('Discord招待切替'))
  .addSubcommand(s => s.setName('short').setDescription('短縮URL切替'))
  .addSubcommand(s =>
    s.setName('log')
      .setDescription('ログチャンネル設定')
      .addChannelOption(o =>
        o.setName('channel')
          .addChannelTypes(ChannelType.GuildText)
          .setDescription('ログ送信先')
          .setRequired(true)
      )
  )
  .addSubcommandGroup(g =>
    g.setName('custom')
      .setDescription('カスタムURL管理')
      .addSubcommand(s =>
        s.setName('add')
          .setDescription('追加')
          .addStringOption(o =>
            o.setName('domain').setDescription('例: github.com').setRequired(true)
          )
      )
      .addSubcommand(s =>
        s.setName('remove')
          .setDescription('削除')
          .addStringOption(o =>
            o.setName('domain').setDescription('削除するURL').setRequired(true)
          )
      )
      .addSubcommand(s =>
        s.setName('list').setDescription('一覧')
      )
  );

client.once('ready', async () => {
  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: [command.toJSON()] }
  );
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async i => {
  if (!i.isChatInputCommand()) return;

  if (!i.inGuild()) {
    return i.reply({
      content: '⚠️ DMでは使用できません',
      flags: MessageFlags.Ephemeral
    });
  }
  if (!i.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return i.reply({
      content: '⚠️ 管理者のみ使用できます',
      flags: MessageFlags.Ephemeral
    });
  }
  const guild = getGuildSetting(i.guildId);
  const sub = i.options.getSubcommand();
  const group = i.options.getSubcommandGroup(false);
  if (sub === 'channel') {
    const mode = i.options.getString('mode');
    if (mode === 'on') {
      getChannelSetting(i.guildId, i.channelId);
      saveSettings();
      return i.reply('✅ このチャンネルを監視対象にしました');
    } else {
      delete guild.channels[i.channelId];
      saveSettings();
      return i.reply('❌ このチャンネルの監視を解除しました');
    }
  }
  if (sub === 'channel_list') {
    const list = Object.keys(guild.channels);
    return i.reply({
      content: list.length
        ? list.map(id => `• <#${id}>`).join('\n')
        : '監視中チャンネルはありません',
      flags: MessageFlags.Ephemeral
    });
  }
  if (!guild.channels[i.channelId]) {
    return i.reply({
      content: '⚠️ このチャンネルは監視ONではありません',
      flags: MessageFlags.Ephemeral
    });
  }
  const channelSetting = getChannelSetting(i.guildId, i.channelId);
  if (['youtube', 'discord', 'short'].includes(sub)) {
    channelSetting[sub] = !channelSetting[sub];
    saveSettings();
    return i.reply(`✅ ${sub} : ${channelSetting[sub] ? 'ON' : 'OFF'}`);
  }
  if (sub === 'log') {
    guild.logChannel = i.options.getChannel('channel').id;
    saveSettings();
    return i.reply('✅ ログチャンネルを設定しました');
  }
  if (group === 'custom') {
    if (sub === 'list') {
      return i.reply({
        content: channelSetting.custom.join('\n') || '登録なし',
        flags: MessageFlags.Ephemeral
      });
    }
    const domain = normalizeDomain(i.options.getString('domain'));
    if (!domain) {
      return i.reply({
        content: '⚠️ 無効なURLです',
        flags: MessageFlags.Ephemeral
      });
    }
    if (sub === 'add' && !channelSetting.custom.includes(domain)) {
      channelSetting.custom.push(domain);
    }
    if (sub === 'remove') {
      channelSetting.custom = channelSetting.custom.filter(d => d !== domain);
    }
    saveSettings();
    return i.reply('✅ 更新しました');
  }
});

client.on('messageCreate', async msg => {
  if (!msg.guild || msg.author.bot) return;
  const guild = getGuildSetting(msg.guild.id);
  const setting = guild.channels[msg.channel.id];
  if (!setting) return;
  if (msg.member.roles.cache.some(r => guild.bypassRoles.includes(r.id))) return;
  const urls = extractUrls(msg.content);
  let reason = null;
  for (const url of urls) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, '');
      if (setting.youtube && matchDomain(host, YOUTUBE_DOMAINS)) {
        reason = 'YouTube';
        break;
      }
      if (setting.discord && matchDomain(host, DISCORD_DOMAINS)) {
        reason = 'Discord招待';
        break;
      }
      if (setting.short && matchDomain(host, SHORT_DOMAINS)) {
        reason = '短縮URL';
        break;
      }
      if (setting.custom.some(d => host === d || host.endsWith(`.${d}`))) {
        reason = `カスタムURL (${host})`;
        break;
      }
    } catch {}
  }
  if (!reason) return;
  await msg.delete().catch(() => {});
  if (guild.logChannel) {
    const ch = msg.guild.channels.cache.get(guild.logChannel);
    if (ch) {
      ch.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('リンク削除')
            .addFields(
              { name: '理由', value: reason },
              { name: 'ユーザー', value: msg.author.tag },
              { name: 'チャンネル', value: `<#${msg.channel.id}>` },
              { name: '時間', value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
            )
        ]
      });
    }
  }
});

client.login(process.env.BOT_TOKEN);
