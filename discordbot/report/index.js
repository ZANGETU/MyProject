const { Client, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, InteractionType } = require('discord.js');
require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder } = require('discord.js');
const clientId = '';
const token = process.env.TOKEN;
let reportChannel = null;  

const commands = [
    new SlashCommandBuilder().setName('report').setDescription('Reportを送ります'),
    new SlashCommandBuilder().setName('setreportchannel').setDescription('レポート送信先のチャンネルを設定します').addChannelOption(option => option.setName('channel').setDescription('レポート送信先のチャンネルを選んでください').setRequired(true)),
]
.map(command => command.toJSON());
const rest = new REST({ version: '9' }).setToken(token);
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(clientId), {
            body: commands,
        });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const TOKEN = process.env.TOKEN;
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        const { commandName } = interaction;
        //setreportchannel
        if (commandName === 'setreportchannel') {
            if (!interaction.guild) return;
            const channel = interaction.options.getChannel('channel');
            //管理者のみ
            if (!interaction.member.permissions.has('ADMINISTRATOR')) {
                return interaction.reply({ content: 'このコマンドを実行する権限がありません', ephemeral: true });
            }
            reportChannel = channel.id;
            await interaction.reply({ content: `レポート送信先のチャンネルが ${channel.name} に設定されました`, ephemeral: true });
        }
        //report
        if (commandName === 'report') {
            if (!reportChannel) {
                return interaction.reply({ content: 'レポート送信先のチャンネルが設定されていません。管理者に確認してください', ephemeral: true });
            }
            const modal = new ModalBuilder()
                .setCustomId('myModal')
                .setTitle('Report');
            const titleInput = new TextInputBuilder()
                .setCustomId('titleInput')
                .setLabel('タイトルを入力してください')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            const contentInput = new TextInputBuilder()
                .setCustomId('contentInput')
                .setLabel('内容を入力してください')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);
            const actionRow1 = new ActionRowBuilder().addComponents(titleInput);
            const actionRow2 = new ActionRowBuilder().addComponents(contentInput);
            modal.addComponents(actionRow1, actionRow2);
            await interaction.showModal(modal);
        }
    }
    //送信後の処理
    if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'myModal') {
            const titleInput = interaction.fields.getTextInputValue('titleInput');
            const contentInput = interaction.fields.getTextInputValue('contentInput');
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(titleInput)
                .setDescription(contentInput)
                .setTimestamp();
            const channel = client.channels.cache.get(reportChannel);
            if (!channel || !channel.isTextBased()) {
                return interaction.reply({ content: 'レポート送信先のチャンネルが見つかりません', ephemeral: true });
            }
            await channel.send({ embeds: [embed] });
            await interaction.reply({ content: 'レポートが送信されました', ephemeral: true });
        }
    }
});

client.login(TOKEN);