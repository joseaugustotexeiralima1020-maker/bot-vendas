const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const DB_FILE = './database.json';

// Criar database se não existir
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({}));
}

function getData() {
    return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveData(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

client.once('ready', () => {
    console.log(`✅ Bot online como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const data = getData();

    // Criar estrutura do servidor se não existir
    if (!data[message.guild.id]) {
        data[message.guild.id] = {
            pix: null,
            lojas: {}
        };
        saveData(data);
    }

    const server = data[message.guild.id];

    // =====================
    // SET PIX
    // =====================
    if (message.content.startsWith("!setpix")) {

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Apenas administradores.");
        }

        const chave = message.content.split(" ")[1];
        if (!chave) return message.reply("Use: !setpix sua_chave_pix");

        server.pix = chave;
        saveData(data);

        return message.reply("✅ PIX configurado com sucesso!");
    }

    // =====================
    // ADD PRODUTO (POR CANAL)
    // =====================
    if (message.content.startsWith("!addproduto")) {

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Apenas administradores.");
        }

        const args = message.content.split(" ").slice(1);
        const nome = args[0];
        const preco = args[1];

        if (!nome || !preco) {
            return message.reply("Use: !addproduto nome preco");
        }

        if (!server.lojas[message.channel.id]) {
            server.lojas[message.channel.id] = [];
        }

        const loja = server.lojas[message.channel.id];

        loja.push({
            id: loja.length + 1,
            nome,
            preco
        });

        saveData(data);

        return message.reply("✅ Produto adicionado neste canal!");
    }

    // =====================
    // REMOVER PRODUTO (POR CANAL)
    // =====================
    if (message.content.startsWith("!removerproduto")) {

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Apenas administradores.");
        }

        const id = parseInt(message.content.split(" ")[1]);
        if (!id) return message.reply("Use: !removerproduto ID");

        if (!server.lojas[message.channel.id]) {
            return message.reply("❌ Este canal não possui catálogo.");
        }

        let loja = server.lojas[message.channel.id];

        loja = loja.filter(p => p.id !== id);

        // Reorganizar IDs
        loja = loja.map((p, index) => ({
            id: index + 1,
            nome: p.nome,
            preco: p.preco
        }));

        server.lojas[message.channel.id] = loja;

        saveData(data);

        return message.reply("🗑 Produto removido!");
    }

    // =====================
    // CATALOGO (POR CANAL)
    // =====================
    if (message.content === "!catalogo") {

        if (!server.lojas[message.channel.id] || server.lojas[message.channel.id].length === 0) {
            return message.reply("📦 Nenhum produto neste catálogo.");
        }

        const loja = server.lojas[message.channel.id];

        let lista = "🟢 **CATÁLOGO DESTA LOJA**\n\n";

        loja.forEach(p => {
            lista += `${p.id}️⃣ ${p.nome}\n💰 R$${p.preco}\n\n`;
        });

        lista += "Para comprar: !comprar ID";

        return message.channel.send(lista);
    }

    // =====================
    // COMPRAR (POR CANAL)
    // =====================
    if (message.content.startsWith("!comprar")) {

        const id = parseInt(message.content.split(" ")[1]);
        if (!id) return message.reply("Use: !comprar ID");

        if (!server.lojas[message.channel.id]) {
            return message.reply("❌ Este canal não possui catálogo.");
        }

        const loja = server.lojas[message.channel.id];
        const produto = loja.find(p => p.id === id);

        if (!produto) return message.reply("❌ Produto não encontrado.");

        if (!server.pix) {
            return message.reply("❌ PIX não configurado neste servidor.");
        }

        const canal = await message.guild.channels.create({
            name: `compra-${message.author.username}`,
            type: 0,
            permissionOverwrites: [
                {
                    id: message.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: message.author.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                }
            ],
        });

        canal.send(`
🛒 **NOVA COMPRA**

👤 Cliente: ${message.author}
📦 Produto: ${produto.nome}
💰 R$${produto.preco}

💳 PIX:
\`${server.pix}\`

Envie o comprovante aqui.
        `);

        return message.reply("✅ Canal de compra criado!");
    }

});

client.login(process.env.TUxMDAxNDE0NA.GD46Ms.7Sm2uuCpLWUuQrePouJtdzvobYM3sAn2DmFcgo");