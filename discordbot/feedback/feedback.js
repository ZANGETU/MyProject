require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder
} = require("discord.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const commands = [
  new SlashCommandBuilder()
    .setName("feedback")
    .setDescription("不具合報告または要望を送信します")
].map(cmd => cmd.toJSON());
const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);
rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands })
  .then(() => console.log("スラッシュコマンド登録完了！"))
  .catch(console.error);

//feedbackコマンド
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "feedback") {
    await interaction.showModal({
      type: 9,
      custom_id: "feedback_modal",
      title: "フィードバック送信",
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "feedback_text",
              style: 2,
              label: "内容を入力してください",
              placeholder: "詳細な内容を書いてください",
              required: true
            }
          ]
        },
        {
          type: 18,
          label: "ファイルを追加できます",
          description: "スクリーンショットや画像を添付してください",
          component: {
            type: 19,
            custom_id: "feedback_files",
            min_values: 0,
            max_values: 1,
            required: false
          }
        }
      ]
    });
  }
});

//送信後の処理
client.on("interactionCreate", async interaction => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId !== "feedback_modal") return;
  await interaction.deferReply({ ephemeral: true });
  const text = interaction.fields.getTextInputValue("feedback_text");
  const field = interaction.fields.fields.get("feedback_files");
  const attachment = field?.attachments?.first() || null;
  //console.log("GOT FILE:", attachment); ←必要なら追加
  const embed = new EmbedBuilder()
    .setTitle("💡 フィードバック受信")
    .setDescription(text)
    .setColor(0x00ff00)
    .setTimestamp()
    .setFooter({
      text: `送信者: ${interaction.user.tag}`,
      iconURL: interaction.user.displayAvatarURL()
    });
  const payload = { embeds: [embed] };
  if (attachment) {
    const filename = attachment.name;
    payload.files = [
      new AttachmentBuilder(attachment.url, { name: filename })
    ];
    embed.setImage(`attachment://${filename}`);
  }
  const channel = await client.channels.fetch(process.env.FEEDBACK_CHANNEL_ID);
  await channel.send(payload);
  await interaction.editReply({
    content: "✅ フィードバックを送信しました",
  });
});

client.login(process.env.BOT_TOKEN);