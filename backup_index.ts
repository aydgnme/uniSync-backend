import Fastify from 'fastify';
import fetch from 'node-fetch';
import authRoutes from './routes/auth';

const app = Fastify({ logger: true });

app.register(authRoutes);

app.listen({ port: 3000 }, () => {
  console.log('🚀 Sunucu http://localhost:3000 adresinde çalışıyor');
});


app.get('/full-orar', async (request, reply) => {
  const { groupName, subgroupIndex } = request.query;

  if (!groupName || !subgroupIndex) {
    return reply.status(400).send({ error: 'groupName ve subgroupIndex gerekli' });
  }

  try {
    // 1. ID'yi bulmak için ilk JSON'u çek
    const res1 = await fetch('https://orar.usv.ro/orar/vizualizare/data/subgrupe.php?json');
    const data1 = await res1.json();

    const match = data1.find(
      item =>
        item.groupName === groupName &&
        String(item.subgroupIndex) === String(subgroupIndex)
    );

    if (!match) {
      return reply.status(404).send({ error: 'Eşleşen kayıt bulunamadı' });
    }

    const id = match.id;

    // 2. Bu ID'yi kullanarak orar verisini çek
    const orarUrl = `https://orar.usv.ro/orar/vizualizare//orar-grupe.php?mod=grupa&ID=${id}&json`;
    const res2 = await fetch(orarUrl);
    const orarData = await res2.json();

    // 3. Orar verisini döndür
    return {
      id,
      groupName: match.groupName,
      subgroupIndex: match.subgroupIndex,
      orar: orarData
    };

  } catch (err) {
    console.error(err);
    return reply.status(500).send({ error: 'Sunucu hatası' });
  }
});

app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running on ${address}`);
});
