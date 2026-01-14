require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
  PermissionsBitField
} = require("discord.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const commands = [
  new SlashCommandBuilder()
    .setName("custom-embed")
    .setDescription("カスタム埋め込みを送信します（管理者のみ）")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
  new SlashCommandBuilder()
    .setName("edit-embed")
    .setDescription("Bot が送信した埋め込みを編集します（管理者のみ）")
    .addStringOption(opt =>
      opt.setName("message_id")
        .setDescription("編集したいメッセージID")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
].map(cmd => cmd.toJSON());
const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);
rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands })
  .then(() => console.log("スラッシュコマンド登録完了！"))
  .catch(console.error);

//custom-embed
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.guild) {
    return interaction.reply({ content: "❌ このコマンドはサーバー内のみで使用できます。", ephemeral: true });
  }
  if (interaction.commandName === "custom-embed") {
    await interaction.showModal({
      type: 9,
      custom_id: "custom_embed_modal",
      title: "カスタム埋め込み送信",
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "embed_author",
              style: 1,
              label: "Author Name",
              placeholder: "例:管理者からのお知らせ",
              required: false
            }
          ]
        },
        //Title
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "title",
              style: 1,
              label: "タイトル",
              required: true
            }
          ]
        },
        //Description
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "description",
              style: 2,
              label: "説明文",
              required: true
            }
          ]
        },
        //Color
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "color",
              style: 1,
              label: "カラー（任意） 例：#00ff00",
              required: false
            }
          ]
        },
        //File upload
        {
          type: 18,
          label: "画像を添付できます",
          description: "埋め込み画像として使用されます",
          component: {
            type: 19,
            custom_id: "image_file",
            min_values: 0,
            max_values: 1,
            required: false
          }
        }
      ]
    });
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId !== "custom_embed_modal") return;
  const authorName = interaction.fields.getTextInputValue("embed_author");
  const title = interaction.fields.getTextInputValue("title");
  const desc = interaction.fields.getTextInputValue("description");
  const colorInput = interaction.fields.getTextInputValue("color");
  let color = 0x2F3136;
  if (colorInput && colorInput.trim() !== "") {
    const input = colorInput.trim();
    if (/^#?[0-9A-Fa-f]{6}$/.test(input)) {
      const hex = input.replace("#", "");
      color = parseInt(hex, 16);
      //RGB "255,128,0" → [255,128,0]
    } else if (/^\d{1,3},\d{1,3},\d{1,3}$/.test(input)) {
      const rgb = input.split(",").map(v => Number(v.trim()));
      if (rgb.every(n => Number.isInteger(n) && n >= 0 && n <= 255)) {
        color = rgb;
      }
    } else if (!isNaN(Number(input))) {
      const num = Number(input);
      if (num >= 0 && num <= 16777215) {
        color = num;
      }
    }
  }
  const fileField = interaction.fields.fields.get("image_file");
  const attachment = fileField?.attachments?.first() || null;
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(color)
    .setTimestamp();
  if (authorName) {
    embed.setAuthor({ name: authorName });
  }
  const payload = { embeds: [embed] };
  if (attachment) {
    const filename = attachment.name;
    payload.files = [
      new AttachmentBuilder(attachment.url, { name: filename })
    ];
    embed.setImage(`attachment://${filename}`);
  }
  await interaction.channel.send(payload);
  await interaction.reply({
    content: "✅ カスタム埋め込みを送信しました！",
    ephemeral: true
  });
});

//edit-embed
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "edit-embed") return;
  const messageId = interaction.options.getString("message_id");
  let msg;
  try {
    msg = await interaction.channel.messages.fetch(messageId);
  } catch {
    return interaction.reply({ content: "❌ メッセージが見つかりません。", ephemeral: true });
  }
  if (msg.author.id !== client.user.id) {
    return interaction.reply({ content: "❌ Bot が送信したメッセージのみ編集できます。", ephemeral: true });
  }
  const oldEmbed = msg.embeds[0];
  const oldTitle = oldEmbed?.title ?? "";
  const oldDesc  = oldEmbed?.description ?? "";
  const oldAuthor = oldEmbed?.author?.name ?? "";
  const oldColor = oldEmbed?.color ? `#${oldEmbed.color.toString(16).padStart(6, "0")}` : "";
  await interaction.showModal({
    type: 9,
    custom_id: `edit_modal_${messageId}`,
    title: "埋め込みを編集",
    components: [
      {
        type: 1,
        components: [
          {
            type: 4,
            custom_id: "edit_author",
            style: 1,
            label: "Author Name（任意）",
            value: oldAuthor,
            required: false
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 4,
            custom_id: "edit_title",
            style: 1,
            label: "タイトル",
            value: oldTitle,
            required: true
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 4,
            custom_id: "edit_description",
            style: 2,
            label: "説明文",
            value: oldDesc,
            required: true
          }
        ]
      },
      {
        type: 1,
        components: [
          {
            type: 4,
            custom_id: "edit_color",
            style: 1,
            label: "カラー（任意） 例：#00ff00",
            value: oldColor,
            required: false
          }
        ]
      },
      {
        type: 18,
        label: "画像を添付できます（任意）",
        description: "既存の画像を差し替えたい場合のみ選択してください",
        component: {
          type: 19,
          custom_id: "edit_image",
          min_values: 0,
          max_values: 1,
          required: false
        }
      }
    ]
  });
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isModalSubmit()) return;
  if (!interaction.customId.startsWith("edit_modal_")) return;
  await interaction.deferReply({ ephemeral: true });
  const messageId = interaction.customId.replace("edit_modal_", "");
  const msg = await interaction.channel.messages.fetch(messageId);
  const oldEmbed = msg.embeds[0];
  const newAuthor = interaction.fields.getTextInputValue("edit_author");
  const newTitle = interaction.fields.getTextInputValue("edit_title");
  const newDesc = interaction.fields.getTextInputValue("edit_description");
  const colorInput = interaction.fields.getTextInputValue("edit_color");
  let color = 0x2F3136;
  if (colorInput && colorInput.trim() !== "") {
    const input = colorInput.trim();
    if (/^#?[0-9A-Fa-f]{6}$/.test(input)) {
      color = parseInt(input.replace("#", ""), 16);
    } else if (!isNaN(Number(input))) {
      const num = Number(input);
      if (num >= 0 && num <= 16777215) color = num;
    }
  }
  const fileField = interaction.fields.fields.get("edit_image");
  const attachment = fileField?.attachments?.first() || null;
  const edited = new EmbedBuilder()
    .setTitle(newTitle)
    .setDescription(newDesc)
    .setColor(color)
    .setTimestamp();
  if (newAuthor) edited.setAuthor({ name: newAuthor });
  let payload;
  if (attachment) {
    const filename = attachment.name;
    edited.setImage(`attachment://${filename}`);
    payload = {
      embeds: [edited],
      files: [new AttachmentBuilder(attachment.url, { name: filename })]
    };
  } else if (oldEmbed?.image?.url) {
    edited.setImage(oldEmbed.image.url);
    payload = {
      embeds: [edited],
      files: []
    };
  } else {
    payload = { embeds: [edited], files: [] };
  }
  await msg.edit(payload);
  await interaction.editReply({ content: "✅ 埋め込みを更新しました！" });
});

client.login(process.env.BOT_TOKEN);