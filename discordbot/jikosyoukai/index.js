const { Client, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, InteractionType, PermissionsBitField } = require('discord.js');
const fs = require('fs');
require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder } = require('discord.js');
const clientId = ''; 
const token = process.env.TOKEN;

//jsonから設定を読み込む
let config = {};
try {
    config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch (error) {
    console.log('config.jsonの読み込みに失敗しました。デフォルト設定を使用します');
}

//グローバルコマンド登録
const commands = [
    new SlashCommandBuilder().setName('setintrochannel').setDescription('自己紹介を表示するチャンネルを設定します').addChannelOption(option => option.setName('channel').setDescription('チャンネルを選んでください').setRequired(true)),
    new SlashCommandBuilder().setName('setintrorole').setDescription('自己紹介用ロールを設定します').addRoleOption(option => option.setName('role').setDescription('ロールを選んでください').setRequired(true)),
    new SlashCommandBuilder().setName('intro').setDescription('自己紹介を送ります'),
]
.map(command => command.toJSON());
const rest = new REST({ version: '9' }).setToken(token);
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(clientId), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });
const TOKEN = process.env.TOKEN;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.guild) {
        return interaction.reply({ content: 'DMでのコマンド実行は許可されていません', ephemeral: true });
    }

    if (interaction.isCommand()) {
        const { commandName } = interaction;
        //setintrochannel
        if (commandName === 'setintrochannel') {
            if (!interaction.guild) return;
            const channel = interaction.options.getChannel('channel');
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: 'このコマンドを実行する権限がありません', ephemeral: true });
            }
            config.introChannel = channel.id;
            fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
            await interaction.reply({ content: `自己紹介チャンネルが ${channel.name} に設定されました`, ephemeral: true });
        }
        //setintrorole
        if (commandName === 'setintrorole') {
            const role = interaction.options.getRole('role');
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: '貴方はコマンドを実行する権限がありません', ephemeral: true });
            }
            config.introRole = role.id; 
            fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
            await interaction.reply({ content: `ロールが ${role.name} に設定されました`, ephemeral: true });
        }

        //intro
        if (commandName === 'intro') {
            if (!config.introChannel) {
                return interaction.reply({ content: '自己紹介送信先のチャンネルが設定されていません。管理者に確認してください', ephemeral: true });
            }
            const modal = new ModalBuilder()
                .setCustomId('introModal')
                .setTitle('自己紹介');
            const nameInput = new TextInputBuilder()
                .setCustomId('nameInput')
                .setLabel('名前を入力してください')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            const hobbyInput = new TextInputBuilder()
                .setCustomId('hobbyInput')
                .setLabel('趣味を入力してください')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);
            const messageInput = new TextInputBuilder()
                .setCustomId('messageInput')
                .setLabel('一言を入力してください')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);
            const actionRow1 = new ActionRowBuilder().addComponents(nameInput);
            const actionRow2 = new ActionRowBuilder().addComponents(hobbyInput);
            const actionRow3 = new ActionRowBuilder().addComponents(messageInput);
            modal.addComponents(actionRow1, actionRow2, actionRow3);
            await interaction.showModal(modal);
        }
    }
    //送信後の処理
    if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'introModal') {
            const name = interaction.fields.getTextInputValue('nameInput');
            const hobby = interaction.fields.getTextInputValue('hobbyInput');
            const message = interaction.fields.getTextInputValue('messageInput');
            const embed = new EmbedBuilder()
             .setColor(0x0099ff)
             .setTitle(`${name}の自己紹介`)
             .setDescription(`趣味: ${hobby}\n一言: ${message}`)
             .setThumbnail(interaction.user.displayAvatarURL())
             .setTimestamp();
            const channel = client.channels.cache.get(config.introChannel);
            if (!channel || !channel.isTextBased()) {
                return interaction.reply({ content: '自己紹介送信先のチャンネルが見つかりません', ephemeral: true });
            }
            await channel.send({ embeds: [embed] });
            //ロールを付与
            if (config.introRole) {
                const member = await interaction.guild.members.fetch(interaction.user.id);
                await member.roles.add(config.introRole);
            }
            await interaction.reply({ content: '自己紹介が送信されました！', ephemeral: true });
        }
    }
});

client.login(TOKEN);
