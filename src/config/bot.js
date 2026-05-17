import discord
from discord.ext import commands
from discord import app_commands
from datetime import timedelta


class TeamCommands(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.count_blacklist = set()

    # =====================================================
    # MODERATION COMMANDS
    # =====================================================

    @app_commands.command(name="mod-timeout", description="Timeoutet einen Nutzer für 1 Tag")
    @app_commands.describe(member="Der Nutzer", reason="Grund für den Timeout")
    async def mod_timeout(
        self,
        interaction: discord.Interaction,
        member: discord.Member,
        reason: str = "Kein Grund angegeben"
    ):
        if not interaction.user.guild_permissions.moderate_members:
            return await interaction.response.send_message(
                "❌ Du hast keine Rechte dafür.",
                ephemeral=True
            )

        await member.timeout(timedelta(days=1), reason=reason)

        embed = discord.Embed(
            title="🔨 Nutzer getimeoutet",
            description=f"{member.mention} wurde für **1 Tag** getimeoutet.",
            color=discord.Color.orange()
        )
        embed.add_field(name="Grund", value=reason, inline=False)

        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="mod-ban", description="Bannt einen Nutzer permanent")
    @app_commands.describe(member="Der Nutzer", reason="Grund für den Bann")
    async def mod_ban(
        self,
        interaction: discord.Interaction,
        member: discord.Member,
        reason: str = "Kein Grund angegeben"
    ):
        if not interaction.user.guild_permissions.ban_members:
            return await interaction.response.send_message(
                "❌ Du hast keine Rechte dafür.",
                ephemeral=True
            )

        await member.ban(reason=reason)

        embed = discord.Embed(
            title="⛔ Nutzer gebannt",
            description=f"{member.mention} wurde permanent gebannt.",
            color=discord.Color.red()
        )
        embed.add_field(name="Grund", value=reason, inline=False)

        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="mod-profil", description="Zeigt das Moderationsprofil eines Nutzers")
    async def mod_profil(
        self,
        interaction: discord.Interaction,
        member: discord.Member
    ):
        embed = discord.Embed(
            title=f"👤 Moderationsprofil - {member}",
            color=discord.Color.blurple()
        )

        embed.set_thumbnail(url=member.display_avatar.url)
        embed.add_field(name="User ID", value=member.id)
        embed.add_field(name="Account erstellt", value=f"<t:{int(member.created_at.timestamp())}:R>")
        embed.add_field(name="Server beigetreten", value=f"<t:{int(member.joined_at.timestamp())}:R>")

        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="mod-warnings", description="Zeigt Verwarnungen eines Nutzers")
    async def mod_warnings(
        self,
        interaction: discord.Interaction,
        member: discord.Member
    ):
        # Hier kannst du später eine Datenbank anbinden
        warnings = []

        embed = discord.Embed(
            title=f"⚠️ Verwarnungen von {member}",
            color=discord.Color.yellow()
        )

        if not warnings:
            embed.description = "Dieser Nutzer hat keine Verwarnungen."
        else:
            embed.description = "\n".join(warnings)

        await interaction.response.send_message(embed=embed)

    # =====================================================
    # COUNTING SYSTEM
    # =====================================================

    @app_commands.command(name="count-blacklist", description="Schließt Nutzer vom Counting-Spiel aus")
    async def count_blacklist_add(
        self,
        interaction: discord.Interaction,
        member: discord.Member
    ):
        if not interaction.user.guild_permissions.manage_messages:
            return await interaction.response.send_message(
                "❌ Keine Berechtigung.",
                ephemeral=True
            )

        self.count_blacklist.add(member.id)

        await interaction.response.send_message(
            f"🚫 {member.mention} wurde vom Counting-Spiel ausgeschlossen."
        )

    @app_commands.command(name="count-blacklist-remove", description="Entfernt einen Nutzer von der Counting-Blacklist")
    async def count_blacklist_remove(
        self,
        interaction: discord.Interaction,
        member: discord.Member
    ):
        self.count_blacklist.discard(member.id)

        await interaction.response.send_message(
            f"✅ {member.mention} wurde wieder freigeschaltet."
        )

    @app_commands.command(name="count-stats", description="Zeigt Counting-Statistiken")
    async def count_stats(self, interaction: discord.Interaction):
        embed = discord.Embed(
            title="🔢 Counting Statistiken",
            color=discord.Color.green()
        )

        embed.add_field(name="Blacklist Nutzer", value=len(self.count_blacklist))
        embed.add_field(name="Aktiver Count", value="0")

        await interaction.response.send_message(embed=embed)

    # =====================================================
    # FUN COMMANDS
    # =====================================================

    @app_commands.command(name="blobfisch", description="Belegt jemanden mit Blobfisch")
    async def blobfisch(
        self,
        interaction: discord.Interaction,
        member: discord.Member
    ):
        embed = discord.Embed(
            title="🐡 Blobfisch Angriff",
            description=f"{member.mention} wurde mit einem Blobfisch belegt.",
            color=discord.Color.purple()
        )

        await interaction.response.send_message(embed=embed)

    # =====================================================
    # TEAM / USER INFO
    # =====================================================

    @app_commands.command(name="team-list", description="Zeigt alle Team-Mitglieder")
    async def team_list(self, interaction: discord.Interaction):
        guild = interaction.guild

        mods = []
        admins = []

        for member in guild.members:
            if member.guild_permissions.administrator:
                admins.append(member.mention)
            elif member.guild_permissions.manage_messages:
                mods.append(member.mention)

        embed = discord.Embed(
            title="🛡️ Team Liste",
            color=discord.Color.blurple()
        )

        embed.add_field(
            name="👑 Admins",
            value="\n".join(admins) if admins else "Keine",
            inline=False
        )

        embed.add_field(
            name="🛠️ Moderatoren",
            value="\n".join(mods) if mods else "Keine",
            inline=False
        )

        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="team-commands", description="Zeigt alle Moderator Commands")
    async def team_commands(self, interaction: discord.Interaction):
        embed = discord.Embed(
            title="🛡️ Mod & Test Mod Commands — Vollständige Übersicht",
            description="Alle verfügbaren Commands für Moderatoren",
            color=discord.Color.red()
        )

        embed.add_field(
            name="🛡️ Moderation",
            value=(
                "`/mod-timeout` — Timeoutet Nutzer für 1 Tag\n"
                "`/mod-ban` — Bannt Nutzer permanent\n"
                "`/mod-profil` — Zeigt Nutzer-Profil mit Straf-Log\n"
                "`/mod-warnings` — Zeigt Bestrafungen eines Nutzers"
            ),
            inline=False
        )

        embed.add_field(
            name="🔢 Counting-Spiel",
            value=(
                "`/count-blacklist` — Schließt Nutzer vom Counting-Spiel aus\n"
                "`/count-blacklist-remove` — Hebt Counting-Ausschluss auf\n"
                "`/count-stats` — Zeigt Counting-Statistiken"
            ),
            inline=False
        )

        embed.add_field(
            name="🎮 Fun",
            value="`/blobfisch` — Belegt jemanden mit Blobfisch",
            inline=False
        )

        embed.add_field(
            name="👤 Nutzer-Informationen",
            value=(
                "`/team-list` — Zeigt alle Team-Mitglieder\n"
                "`/team-commands` — Zeigt alle Moderator-Commands"
            ),
            inline=False
        )

        embed.set_footer(text="Für Test Mods, Mods und Admins sichtbar")

        await interaction.response.send_message(embed=embed)


async def setup(bot):
    await bot.add_cog(TeamCommands(bot))
