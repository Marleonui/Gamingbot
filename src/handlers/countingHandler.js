import { logger } from '../../utils/logger.js';
import { errorEmbed, successEmbed } from '../../utils/embeds.js';
import { getGuildConfig, setGuildConfig } from '../../services/guildConfig.js';

export async function handleCounting(message, client) {
    try {
        if (message.author.bot || !message.guild) return;

        const guildConfig = await getGuildConfig(client, message.guild.id);

        if (!guildConfig.counting?.enabled) {
            return;
        }

        // Überprüfe, ob diese Nachricht im Counting-Kanal ist
        if (message.channel.id !== guildConfig.counting.channelId) {
            return;
        }

        // Überprüfe, ob der Nutzer auf der Blacklist ist
        const blacklist = guildConfig.counting.blacklist || [];
        if (blacklist.includes(message.author.id)) {
            try {
                await message.delete();
            } catch (err) {
                logger.warn('Could not delete message from blacklisted user:', err);
            }
            return;
        }

        // Versuche, die Nachricht als Zahl zu parsen
        const content = message.content.trim();
        const userNumber = parseInt(content, 10);

        // Überprüfe, ob es eine gültige Zahl ist
        if (isNaN(userNumber)) {
            // Lösche die Nachricht, wenn sie keine Zahl ist
            try {
                await message.delete();
            } catch (err) {
                logger.warn('Could not delete invalid counting message:', err);
            }
            return;
        }

        const expectedNumber = (guildConfig.counting.currentNumber || 0) + 1;
        const lastUserId = guildConfig.counting.lastUserId;

        // Überprüfe, ob die richtige Zahl eingegeben wurde
        if (userNumber !== expectedNumber) {
            // Falsche Zahl! Spiel wird zurückgesetzt
            const failUser = message.author;
            const previousUser = lastUserId ? await client.users.fetch(lastUserId).catch(() => null) : null;

            // Update Rekord wenn nötig
            if (guildConfig.counting.currentNumber > (guildConfig.counting.record || 0)) {
                guildConfig.counting.record = guildConfig.counting.currentNumber;
                await setGuildConfig(client, message.guild.id, guildConfig);
            }

            // Reset
            guildConfig.counting.currentNumber = 0;
            guildConfig.counting.lastUserId = null;
            await setGuildConfig(client, message.guild.id, guildConfig);

            const embed = errorEmbed(
                `❌ **${failUser.username}** hat einen Fehler gemacht! Die richtige Zahl war **${expectedNumber}**, aber **${userNumber}** wurde eingegeben.\n\n🔄 Das Spiel wird neu gestartet!\n\n📊 Erreichte Zahl: **${guildConfig.counting.currentNumber}**\n🏆 Rekord: **${guildConfig.counting.record}**`,
                'Counting-Spiel - Fehler!'
            );

            await message.reply({ embeds: [embed] });

            // Lösche die fehlerhafte Nachricht nach kurzer Zeit
            try {
                setTimeout(() => message.delete().catch(() => {}), 3000);
            } catch (err) {
                logger.warn('Error scheduling message deletion:', err);
            }

            return;
        }

        // Überprüfe, ob derselbe Benutzer zweimal hintereinander zählt
        if (lastUserId === message.author.id) {
            // Falscher Spieler! Spiel wird zurückgesetzt
            const previousNumber = guildConfig.counting.currentNumber;

            if (previousNumber > (guildConfig.counting.record || 0)) {
                guildConfig.counting.record = previousNumber;
            }

            guildConfig.counting.currentNumber = 0;
            guildConfig.counting.lastUserId = null;
            await setGuildConfig(client, message.guild.id, guildConfig);

            const embed = errorEmbed(
                `❌ **${message.author.username}** hat zweimal hintereinander gezählt!\n\n🔄 Das Spiel wird neu gestartet!\n\n📊 Erreichte Zahl: **${previousNumber}**\n🏆 Rekord: **${guildConfig.counting.record}**`,
                'Counting-Spiel - Falscher Spieler!'
            );

            await message.reply({ embeds: [embed] });

            try {
                setTimeout(() => message.delete().catch(() => {}), 3000);
            } catch (err) {
                logger.warn('Error scheduling message deletion:', err);
            }

            return;
        }

        // Richtige Zahl! Update den Counter
        guildConfig.counting.currentNumber = userNumber;
        guildConfig.counting.lastUserId = message.author.id;
        await setGuildConfig(client, message.guild.id, guildConfig);

        // Reagiere mit einem Häkchen
        try {
            await message.react('✅');
        } catch (err) {
            logger.warn('Could not add reaction to counting message:', err);
        }

        // Optional: Nachricht mit Statistiken editieren
        try {
            const statsEmbed = successEmbed(
                `**Aktuelle Zahl:** ${userNumber}\n🏆 Rekord: **${guildConfig.counting.record}**`,
                'Counting Fortschritt'
            );
            // Sende eine kleine Stats-Nachricht alle X Zahlen (z.B. alle 10)
            if (userNumber % 10 === 0) {
                await message.channel.send({ embeds: [statsEmbed] }).then(msg => {
                    setTimeout(() => msg.delete().catch(() => {}), 5000);
                });
            }
        } catch (err) {
            logger.warn('Error handling counting stats:', err);
        }

    } catch (error) {
        logger.error('Error in handleCounting:', error);
    }
}
