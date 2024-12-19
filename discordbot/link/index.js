require('dotenv').config();
const fs = require('fs');
const {Client,GatewayIntentBits,Partials,EmbedBuilder,PermissionsBitField,REST,Routes,} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.User],
});

//正規表現
const linkPatterns = {
  discord: /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord\.com\/invite)\/[^\s]+/i, //Discord招待リンク
  youtube: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|channel\/|user\/|c\/|@)|youtu\.be\/)[^\s]+/i, //YouTubeリンク
  twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com\/|x\.com\/)[^\s]+/i, //Twitter(X)リンク
  tiktok: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/[^\s]+/i, //TikTokリンク
};
//カスタムリンク
let customLinks = [];
//設定保存用
const monitoredChannels = new Map();
const logChannels = new Map();
const domainLists = new Map();
//設定保存関数
function saveSettings() {
  const data = {
    monitoredChannels: Object.fromEntries(monitoredChannels),
    logChannels: Object.fromEntries(logChannels),
    customLinks,
    domainLists: Object.fromEntries([...domainLists].map(([k, v]) => [k, [...v]])),
  };
  fs.writeFileSync('settings.json', JSON.stringify(data, null, 2));
}
//設定を読み込む
function loadSettings() {
  if (fs.existsSync('settings.json')) {
    const data = JSON.parse(fs.readFileSync('settings.json'));
    for (const [channelId, settings] of Object.entries(data.monitoredChannels)) {
      monitoredChannels.set(channelId, settings);
    }
    for (const [guildId, logChannelId] of Object.entries(data.logChannels)) {
      logChannels.set(guildId, logChannelId);
    }
    customLinks = data.customLinks || [];
    for (const [guildId, domains] of Object.entries(data.domainLists)) {
      if (!(domains instanceof Set)) {
        domainLists.set(guildId, new Set(Object.values(domains)));
      } else {
        domainLists.set(guildId, domains);
      }
    }
  }
}
//起動時に設定を読み込む
loadSettings();
client.once('ready', async () => {
  console.log(`${client.user.tag} でログインしました！`);
  const commands = [
    {
      //メイン
      name: 'monitor',
      description: '監視するリンクの設定を行います',
      dm_permission: false,
      options: [
        {
          type: 1,
          name: 'set',
          description: '監視するリンクを設定できます',
          options: [
            {
              type: 7,
              name: 'channel',
              description: '監視するチャンネル',
              required: true,
            },
            {
              type: 5,
              name: 'discord',
              description: 'Discord招待リンクの削除',
              required: true,
            },
            {
              type: 5,
              name: 'youtube',
              description: 'あらゆるYouTubeリンクの削除',
              required: true,
            },
            {
              type: 5,
              name: 'twitter',
              description: 'Twitter(X)のツイートリンクの削除',
              required: true,
            },
            {
              type: 5,
              name: 'tiktok',
              description: 'TikTokリンクの削除',
              required: true,
            },
          ],
        },
        {
          type: 1,
          name: 'remove',
          description: '監視を解除します',
          options: [
            {
              type: 7,
              name: 'channel',
              description: '解除するチャンネル',
              required: true,
            },
          ],
        },
        {
          type: 1,
          name: 'log',
          description: 'ログ送信先のチャンネルを設定',
          options: [
            {
              type: 7,
              name: 'channel',
              description: 'ログを送るチャンネル',
              required: true,
            },
          ],
        },
      ],
    },
    {
      //カスタムリンク
      name: 'customlink',
      description: 'カスタムリンクの管理を行います',
      dm_permission: false,
      options: [
        {
          type: 1,
          name: 'add',
          description: 'カスタムリンクを追加します',
          options: [
            {
              type: 3,
              name: 'link',
              description: '追加するリンク',
              required: true,
            },
          ],
        },
        {
          type: 1,
          name: 'remove',
          description: 'カスタムリンクを削除します',
          options: [
            {
              type: 3,
              name: 'link',
              description: '削除するリンク',
              required: true,
            },
          ],
        },
        {
          type: 1,
          name: 'list',
          description: '登録されているカスタムリンクを表示します',
        },
      ],
    },
    {
      //ドメイン
      name: 'domain',
      description: '特定のドメインを削除対象に設定します',
      dm_permission: false,
      options: [
        {
          type: 1, 
          name: 'add',
          description: '削除対象のドメインを追加します',
          options: [
            {
              type: 3,
              name: 'domain',
              description: '追加するドメイン(例: .com .jp)',
              required: true,
            },
          ],
        },
        {
          type: 1,
          name: 'remove',
          description: '削除対象からドメインを解除します',
          options: [
            {
              type: 3,
              name: 'domain',
              description: '削除するドメイン(例: .com .jp)',
              required: true,
            },
          ],
        },
        {
          type: 1,
          name: 'list',
          description: '現在削除対象に登録されているドメインを表示します',
        },
      ],
    },
  ];
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    console.log('スラッシュコマンドを登録中...');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log('スラッシュコマンドの登録が完了しました！');
  } catch (error) {
    console.error(error);
  }
});

//メッセージ削除とログ送信
async function deleteMessageAndLog(message, reason) {
  try {
    await message.delete();
    const logChannelId = logChannels.get(message.guild.id);
    const logChannel = message.guild.channels.cache.get(logChannelId);
    if (logChannel?.isTextBased()) {
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('メッセージが削除されました')
        .setDescription(`**理由:** ${reason}\n**投稿者:** ${message.author} (${message.author.tag})`)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '投稿内容', value: message.content || 'メッセージなし' },
          { name: '投稿されたチャンネル', value: `<#${message.channel.id}>`, inline: true }, 
          { name: '投稿時刻', value: `<t:${Math.floor(message.createdTimestamp / 1000)}:F>`, inline: true } 
        )
        .setTimestamp();
      logChannel.send({ embeds: [embed] });
    }

    //DMに警告
    const warningEmbed = new EmbedBuilder()
      .setColor('Yellow')
      .setTitle('警告')
      .setDescription('以下のリンクは送信が禁止されています:\n' + reason)
      .addFields(
        { name: '投稿者', value: message.author.tag, inline: true },
        { name: '違反リンク', value: message.content, inline: true }
      )
      .setTimestamp();
    await message.author.send({ embeds: [warningEmbed] });
  } catch (error) {
    console.error('メッセージの削除に失敗しました', error);
  }
}

//メッセージ作成
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  const settings = monitoredChannels.get(message.channel.id);
  if (!settings) return;
  if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
  for (const [type, regex] of Object.entries(linkPatterns)) {
    if (settings[type] && regex.test(message.content)) {
      await deleteMessageAndLog(message, `${type}`);
      return;
    }
  }
  //カスタムリンク削除
  for (const link of customLinks) {
    if (message.content.includes(link)) {
      await deleteMessageAndLog(message, `カスタムリンク`);
      return;
    }
  }
  //ドメイン削除
  const guildId = message.guild.id;
  const domainSet = domainLists.get(guildId);
  if (domainSet) {
    for (const domain of domainSet) {
      if (message.content.toLowerCase().includes(domain)) {
        await deleteMessageAndLog(message, `特定ドメイン (${domain})`);
        return;
      }
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName, options, guild, member } = interaction;
  if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({
      content: 'このコマンドは管理者のみ使用できます',
      ephemeral: true,
    });
  }
  //コマンド処理
  if (commandName === 'monitor') {
    const subCommand = options.getSubcommand();
    if (subCommand === 'set') {
      const channel = options.getChannel('channel');
      const discord = options.getBoolean('discord');
      const youtube = options.getBoolean('youtube');
      const twitter = options.getBoolean('twitter');
      const tiktok = options.getBoolean('tiktok');

      monitoredChannels.set(channel.id, { discord, youtube, twitter, tiktok });
      saveSettings();
      return interaction.reply(`チャンネル \`${channel.name}\` のリンク監視設定が完了しました`);
    } else if (subCommand === 'remove') {
      const channel = options.getChannel('channel');
      monitoredChannels.delete(channel.id);
      saveSettings();
      return interaction.reply(`チャンネル \`${channel.name}\` のリンク監視設定が解除されました`);
    } else if (subCommand === 'log') {
      const channel = options.getChannel('channel');
      logChannels.set(guild.id, channel.id);
      saveSettings();
      return interaction.reply(`ログ送信先チャンネルが \`${channel.name}\` に設定されました`);
    }
  }
  //カスタムリンク
  if (commandName === 'customlink') {
    const subCommand = options.getSubcommand();

    if (subCommand === 'add') {
      const link = options.getString('link');
      //リンクの形式が有効か確認する正規表現
      const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/[^\s]*)?$/;
      if (!urlPattern.test(link)) {
        return interaction.reply({
          content: `リンク \`${link}\` は無効な形式です。正しいURLを入力してください(例: https://example.com)`,
          ephemeral: true,
        });
      }
      customLinks.push(link);
      saveSettings();
      return interaction.reply(`カスタムリンク \`${link}\`が追加されました`);
    } else if (subCommand === 'remove') {
      const link = options.getString('link');
      customLinks = customLinks.filter(l => l !== link);
      saveSettings();
      return interaction.reply(`カスタムリンク \`${link}\`が削除されました`);
    } else if (subCommand === 'list') {
      if (customLinks.length === 0) {
        return interaction.reply('現在、登録されているカスタムリンクはありません');
      }
      return interaction.reply(`登録されているカスタムリンク: \n\`${customLinks.join('\n')}\``);
    }
  }
  //ドメイン
  if (commandName === 'domain') {
    const subCommand = options.getSubcommand();
    if (subCommand === 'add') {
      const domain = options.getString('domain');
      const guildId = guild.id;
      //ドメインの最後の部分が有効なTLDかどうかを確認する正規表現
      const domainPattern = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
      //ドメインがTLDの形式であるか確認
      if (!domainPattern.test(domain)) {
        return interaction.reply({
          content: `ドメイン \`${domain}\` は無効な形式です。有効なTLD(例: .com, .jp)を追加してください。`,
          ephemeral: true,
        });
      }
      //ドメインを削除対象に追加
      if (!domainLists.has(guildId)) {
        domainLists.set(guildId, new Set());
      }
      domainLists.get(guildId).add(domain);
      saveSettings();
      return interaction.reply(`ドメイン \`${domain}\`が削除対象に追加されました`);
    } else if (subCommand === 'remove') {
      const domain = options.getString('domain');
      const guildId = guild.id;
      if (domainLists.has(guildId)) {
        domainLists.get(guildId).delete(domain);
        saveSettings();
        return interaction.reply(`ドメイン \`${domain}\`が削除対象から削除されました`);
      }
      return interaction.reply(`ドメイン \`${domain}\`は現在、削除対象にありません`);
    } else if (subCommand === 'list') {
      const guildId = guild.id;
      const domains = domainLists.get(guildId);
      if (!domains || domains.size === 0) {
        return interaction.reply('現在、削除対象に登録されているドメインはありません');
      }
      return interaction.reply(`現在、削除対象に登録されているドメイン: \n\`${Array.from(domains).join('\n')}\``);
    }
  }
});

client.login(process.env.TOKEN);