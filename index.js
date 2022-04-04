
const mySecret = process.env['DISCORD_BOT_TOKEN']
const Discord = require("discord.js");
const { prefix, token } = require("./config.json");
const ytdl = require("ytdl-core");

const client = new Discord.Client();
const keepAlive = require("./server");

client.on("ready", () => {
    client.user.setActivity("com o cu do tuti", {
        type: "STREAMING",
      })
});

const queue = new Map();

client.once("ready", () => {
  console.log("oi!");
});

client.once("reconnecting", () => {
  console.log("voltando!");
});

client.once("disconnect", () => {
  console.log("sai!");
});

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}play`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
} else if (message.content.startsWith(`${prefix}tocar`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}pular`)) {
    stop(message, serverQueue);
    return;
} else if (message.content.startsWith(`${prefix}s`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}p`)) {
    execute(message, serverQueue);
    return;
  } else {
    message.channel.send("comando invalidooooooooo");
  }
});

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "VC N TA NO VOICE MLK"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "to sem perm :("
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
   };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} botei ai essa merda`);
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "entra numa sala de voz"
    );
  if (!serverQueue)
    return message.channel.send("n tem oq skipar");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "vc n ta no voice"
    );
    
  if (!serverQueue)
    return message.channel.send("n tem oq parar ta vazio a queue!");
    
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`vo toca **${song.title}** emmmmmmm`);
}

keepAlive();

client.login(process.env.DISCORD_BOT_TOKEN);