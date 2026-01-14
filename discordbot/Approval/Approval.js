require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const commands = [
  new SlashCommandBuilder()
    .setName("apply")
    .setDescription("サーバー参加申請フォームを開きます")
].map(cmd => cmd.toJSON());
new (require("@discordjs/rest").REST)({ version: "10" })
  .setToken(process.env.BOT_TOKEN)
  .put(
    require("discord.js").Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  )
  .then(() => console.log("スラッシュコマンド登録完了！"))
  .catch(console.error);

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "apply") return;
  await interaction.showModal({
    type: 9,
    custom_id: "apply_modal",
    title: "サーバー参加申請",
    components: [
      //年齢
      {
        type: 18,
        label: "年齢層",
        description: "あなたの年齢層を教えてください",
        component: {
          type: 3,
          custom_id: "age_group",
          min_values: 1,
          max_values: 1,
          options: [
            { label: "13〜15", value: "13-15" },
            { label: "16〜18", value: "16-18" },
            { label: "19〜24", value: "19-24" },
            { label: "25以上", value: "25+" }
          ]
        }
      },
      //情報
      {
        type: 18,
        label: "どこでこのサーバーを知りましたか？",
        description: "1つ選択してください",
        component: {
          type: 3,
          custom_id: "discover_source",
          min_values: 1,
          max_values: 1,
          options: [
            { label: "YouTube", value: "YouTube", emoji: "▶️" },
            { label: "ディス速", value: "ディス速", emoji: "💬" },
            { label: "Disboard", value: "Disboard", emoji: "🌐" },
            { label: "宣伝（広告）", value: "宣伝", emoji: "📢" },
            { label: "紹介（フレンドから）", value: "紹介", emoji: "👥" }
          ]
        }
      },
      //興味あるカテゴリ
      {
        type: 18,
        label: "興味あるカテゴリ",
        description: "貴方の興味があるカテゴリを教えてください(複数選択可)",
        component: {
          type: 3,
          custom_id: "interest",
          min_values: 1,
          max_values: 5,
          options: [
            { label: "ゲーム", value: "ゲーム" },
            { label: "音楽", value: "音楽" },
            { label: "プログラミング", value: "プログラミング" },
            { label: "アニメ", value: "アニメ" },
            { label: "雑談", value: "雑談" }
          ]
        }
      },
      //自己紹介
      {
        type: 18,
        label: "自己紹介",
        description: "軽く自己紹介をお願いします",
        component: {
          type: 4,
          custom_id: "profile",
          style: 2,
          placeholder: "例:初めまして！ガンダムが大好きです。よろぴく♪",
          required: true,
          max_length: 500
        }
      }
    ]
  });
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId !== "apply_modal") return;
  const ageField = interaction.fields.fields.get("age_group");
  const age = ageField.values[0];
  const interestField = interaction.fields.fields.get("interest");
  const interests = interestField.values;
  const sourceField = interaction.fields.fields.get("discover_source");
  const discover_source = sourceField.values[0];
  const profile = interaction.fields.getTextInputValue("profile");
  const embed = new EmbedBuilder()
    .setTitle("📨 新しい参加申請が届きました")
    .addFields(
      {
        name: "👤 ユーザー",
        value: `<@${interaction.user.id}> (${interaction.user.tag} / ${interaction.user.id})`
      },
      { name: "📅 年齢グループ", value: age, inline: true },
      { 
        name: "⭐ 興味カテゴリ", 
        value: interests.map(v => `・${v}`).join("\n"),
        inline: true 
      },      
      { name: "🔍 どこでこの鯖を知った?", value: discover_source, inline: true },
      { name: "📝 自己紹介", value: profile }
    )
    .setColor(0x3498db)
    .setThumbnail(interaction.user.displayAvatarURL())
    .setTimestamp();
  //ボタン追加
  const approveButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`approve_${interaction.user.id}`)
      .setLabel("承認してロール付与")
      .setStyle(ButtonStyle.Success)
  );
  //管理チャンネルへ送信
  const channel = await client.channels.fetch(process.env.APPLY_CHANNEL_ID);
  await channel.send({
    embeds: [embed],
    components: [approveButton]
  });
  //送信者へ返信
  await interaction.reply({
    content: "✅ 参加申請を送信しました。審査が終わるまでお待ちください!!",
    flags: 64
  });
});

//承認ボタン
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith("approve_")) return;
  const targetUserId = interaction.customId.split("_")[1];
  const roleId = process.env.APPLY_ROLE_ID;
  try {
    const member = await interaction.guild.members.fetch(targetUserId);
    await member.roles.add(roleId);
    await interaction.reply({
      content: `✅ <@${targetUserId}> にロールを付与しました`,
      ephemeral: true
    });
  } catch (error) {
    await interaction.reply({
      embeds: [
        {
          title: "⚠ ロール付与エラー",
          description:
            "ロールを付与できませんでした。\n" +
            "```" + error.message + "```\n" +
            "### よくある原因\n" +
            "•Botのロールが対象ロールより下にある\n" +
            "•Botに「ロールの管理」権限が無い\n" +
            "•付与しようとしたロールが管理者ロール\n" +
            "•サーバーのロール構成ミス\n",
          color: 0xff0000
        }
      ],
      ephemeral: true
    });
  }
});

client.login(process.env.BOT_TOKEN);