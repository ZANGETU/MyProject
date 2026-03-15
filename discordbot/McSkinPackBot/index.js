require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  SelectMenuBuilder,
  AttachmentBuilder,
  StringSelectMenuBuilder
} = require("discord.js");

const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");
const { v4: uuidv4 } = require("uuid");
const fetch = require("node-fetch");
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const commands = [
  new SlashCommandBuilder().setName("skin").setDescription("スキン管理")
    .addSubcommand(sub => sub.setName("create").setDescription("新しいスキンパックを作成"))
    .addSubcommand(sub => sub.setName("add").setDescription("スキン画像を追加"))
    .addSubcommand(sub => sub.setName("setting").setDescription("スキン名や腕タイプを編集"))
    .addSubcommand(sub => sub.setName("delete").setDescription("スキンを削除"))
    .addSubcommand(sub => sub.setName("build").setDescription(".mcpackを生成"))
].map(cmd => cmd.toJSON());
const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);
rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands })
  .then(() => console.log("スラッシュコマンド登録完了"))
  .catch(console.error);
const sessions = new Map();
client.on("interactionCreate", async interaction => {
  if (interaction.isChatInputCommand() && interaction.commandName === "skin") {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    if (sub === "create") {
      const modal = new ModalBuilder()
        .setCustomId("skin_create_modal")
        .setTitle("スキンパック作成")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("pack_name")
              .setLabel("パック名")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
      return interaction.showModal(modal);
    }
    if (sub === "add") {
      const session = sessions.get(userId);
      if (!session) return interaction.reply({ content: "先に /skin create でパックを作成してください", ephemeral: true });
      if (session.addCount >= 2) {
        return interaction.reply({
          content: "❌ /skin add は最大2回まで使用できます。/skin build を実行するとリセットされます",
          ephemeral: true
        });
      }
      return interaction.showModal(new ModalBuilder()
        .setCustomId("skin_add_modal")
        .setTitle("スキン追加")
        .addComponents({
          type: 18,
          label: "PNGを添付（最大10）",
          description: "複数選択可能",
          component: { type: 19, custom_id: "skin_file", min_values: 1, max_values: 10, required: true }
        })
      );
    }
    if (sub === "setting") {
      const session = sessions.get(userId);
      if (!session || session.skins.length === 0) return interaction.reply({ content: "編集するスキンがありません", ephemeral: true });
      const selectMenu = new SelectMenuBuilder()
        .setCustomId("select_skin_to_edit")
        .setPlaceholder("スキンを選択")
        .addOptions(session.skins.map(s => ({ label: s.name || "未設定スキン", value: s.id })));
      return interaction.reply({ content: "編集するスキンを選択してください", components: [new ActionRowBuilder().addComponents(selectMenu)], ephemeral: true });
    }
    if (sub === "delete") {
      const session = sessions.get(userId);
      if (!session || session.skins.length === 0) return interaction.reply({ content: "削除するスキンがありません", ephemeral: true });
      const selectMenu = new SelectMenuBuilder()
        .setCustomId("select_skin_to_delete")
        .setPlaceholder("削除するスキンを選択")
        .addOptions(session.skins.map(s => ({ label: s.name || "未設定スキン", value: s.id })));
      return interaction.reply({ content: "削除するスキンを選択してください", components: [new ActionRowBuilder().addComponents(selectMenu)], ephemeral: true });
    }
    if (sub === "build") {
      const session = sessions.get(userId);
      if (!session || session.skins.length === 0) {
        return interaction.reply({ content: "スキンが追加されていません", ephemeral: true });
      }
      await interaction.deferReply({ ephemeral: true });
      const safeName = session.packName.replace(/\s+/g, "_");
      const outputPath = path.join(__dirname, `${safeName}.mcpack`);
      try {
        await createMcPack(session, outputPath);
        await interaction.editReply({
          content: "✅ mcpackを生成しました",
          files: [new AttachmentBuilder(outputPath)]
        });
        session.addCount = 0;
        session.skins = [];
        await fs.remove(outputPath);
      } catch (e) {
        console.error(e);
        await interaction.editReply({ content: "❌ mcpack生成に失敗しました" });
      }
      return;
    }
  }
  if (interaction.isModalSubmit()) {
    const userId = interaction.user.id;
    if (interaction.customId === "skin_create_modal") {
      const packName = interaction.fields.getTextInputValue("pack_name");
      sessions.set(userId, {
        packName,
        skins: [],
        addCount: 0 //（最大2回）
      }); return interaction.reply({ content: `✅ スキンパック「${packName}」を作成しました\n次に /skin add で画像を追加してください`, ephemeral: true });
    }
    if (interaction.customId === "skin_add_modal") {
      const field = interaction.fields.fields.get("skin_file");
      const attachments = field?.attachments?.values() || [];
      const session = sessions.get(userId);
      for (const attachment of attachments) {
        if (!attachment.contentType.startsWith("image/png")) continue;
        const fileName = attachment.name.replace(/\.[^/.]+$/, "");
        session.skins.push({
          id: uuidv4(),
          url: attachment.url,
          name: fileName,
          type: "steve"
        });
      }
      session.addCount++;
      return interaction.reply({
        content: `✅ スキンを追加しました（${session.addCount}/2）`,
        ephemeral: true
      });
    }
  }
  if (interaction.isStringSelectMenu()) {
    const userId = interaction.user.id;
    const session = sessions.get(userId);
    if (!session) return interaction.reply({ content: "セッションが見つかりません", ephemeral: true });
    if (interaction.customId === "select_skin_to_edit") {
      const selectedSkin = session.skins.find(s => s.id === interaction.values[0]);
      if (!selectedSkin) return interaction.reply({ content: "スキンが見つかりません", ephemeral: true });
      const modal = new ModalBuilder()
        .setCustomId(`edit_skin_${selectedSkin.id}`)
        .setTitle("スキン名を編集")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("skin_name")
              .setLabel("スキン名")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setValue(selectedSkin.name || "")
          )
        );
      return interaction.showModal(modal);
    }
    if (interaction.customId === "select_skin_to_delete") {
      const selectedId = interaction.values[0];
      const skin = session.skins.find(s => s.id === selectedId);
      session.skins = session.skins.filter(s => s.id !== selectedId);
      return interaction.reply({ content: `✅ スキン「${skin.name || "未設定"}」を削除しました`, ephemeral: true });
    }
    if (interaction.customId.startsWith("arm_type_")) {
      const skinId = interaction.customId.replace("arm_type_", "");
      const skin = session.skins.find(s => s.id === skinId);
      if (!skin) return interaction.reply({ content: "スキンが見つかりません", ephemeral: true });
      skin.type = interaction.values[0];
      return interaction.reply({ content: `✅ スキン「${skin.name}」の腕タイプを「${skin.type}」に変更しました`, ephemeral: true });
    }
  }
  if (interaction.isModalSubmit() && interaction.customId.startsWith("edit_skin_")) {
    const skinId = interaction.customId.replace("edit_skin_", "");
    const session = sessions.get(interaction.user.id);
    const skin = session.skins.find(s => s.id === skinId);
    if (!skin) {
      return interaction.reply({ content: "スキンが見つかりません", ephemeral: true });
    }
    const newName = interaction.fields.getTextInputValue("skin_name");
    skin.name = newName;
    return interaction.reply({
      content: "腕タイプを選択してください",
      components: [
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`arm_type_${skin.id}`)
            .setPlaceholder("腕タイプを選択")
            .addOptions([
              { label: "Steve", value: "steve", default: skin.type === "steve" },
              { label: "Alex", value: "alex", default: skin.type === "alex" }
            ])
        )
      ],
      ephemeral: true
    });
  }
  if (interaction.customId === "select_skin_to_delete") {
    const selectedId = interaction.values[0];
    const skin = session.skins.find(s => s.id === selectedId);
    session.skins = session.skins.filter(s => s.id !== selectedId);
    return interaction.reply({ content: `✅ スキン「${skin.name || "未設定"}」を削除しました`, ephemeral: true });
  }
}
);
async function createMcPack(session, outputPath) {
  const headerUUID = uuidv4();
  const moduleUUID = uuidv4();
  const manifest = {
    format_version: 1,
    header: {
      name: session.packName,
      uuid: headerUUID,
      version: [1, 0, 0]
    },
    modules: [
      {
        type: "skin_pack",
        uuid: moduleUUID,
        version: [1, 0, 0]
      }
    ]
  };
  const skinsJson = {
    localization_name: session.packName,
    serialize_name: session.packName.toLowerCase(),
    geometry: "skinpacks/skins.json",
    skins: session.skins.map((s, i) => ({
      localization_name: s.name,
      geometry: s.type === "alex"
        ? "geometry.humanoid.customSlim"
        : "geometry.humanoid.custom",
      texture: `skin_${i}.png`,
      type: "free",
      hide_armor: false
    }))
  };
  const langLines = [];
  for (const s of session.skins) {
    langLines.push(`skin.${session.packName}.${s.name}=${s.name}`);
  }
  langLines.push(`skinpack.${session.packName}=${session.packName}`);
  const output = fs.createWriteStream(outputPath);
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(output);
  archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });
  archive.append(JSON.stringify(skinsJson, null, 2), { name: "skins.json" });
  archive.append(langLines.join("\n"), {
    name: "texts/en_US.lang"
  });
  for (let i = 0; i < session.skins.length; i++) {
    const s = session.skins[i];
    const res = await fetch(s.url);
    const buffer = Buffer.from(await res.arrayBuffer());
    archive.append(buffer, {
      name: `skin_${i}.png`
    });
  }
  await archive.finalize();
}

client.login(process.env.BOT_TOKEN);