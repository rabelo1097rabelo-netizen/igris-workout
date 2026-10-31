// Vercel Serverless Function: /api/workout
// Gerencia a sincronização do Treino do Dia entre o Desktop Garmin e o Celular

let currentWorkout = {
  id: 421,
  date: new Date().toISOString().split('T')[0],
  title: "Corrida de Base Z2 • Limiar Aeróbico",
  sport_type: "Corrida",
  duration_mins: 35,
  distance_km: 4.8,
  target_pace: "5:30/km",
  target_hr_bpm: 155,
  intensity_level: "moderate",
  ai_strategy: "Mantenha a respiração estável em 3:3 passadas. Foco estrito em Z2 sem deixar a frequência cardíaca disparar na subida.",
  intervals: [
    { name: "Aquecimento Leve", duration_mins: 8, target_zone: "Z1" },
    { name: "Corrida de Base Contínua", duration_mins: 22, target_zone: "Z2", target_metric: "Pace 5:30/km" },
    { name: "Desaquecimento", duration_mins: 5, target_zone: "Z1" }
  ],
  is_completed: false,
  completed_at: null,
  garmin_uploaded: false,
  hunter_rank: "Rank B",
  hunter_level: 24,
  exp_progress: 78,
  attributes: {
    str: 42,
    agi: 58,
    vit: 64,
    per: 37,
    int: 29
  },
  updated_at: new Date().toISOString()
};

let syncCommands = [];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Retorna o treino atual do dia e o status
  if (req.method === 'GET') {
    const action = req.query ? req.query.action : null;
    
    // Se o desktop estiver puxando comandos pendentes enviados pelo celular
    if (action === 'poll_commands') {
      const pending = [...syncCommands];
      syncCommands = [];
      return res.status(200).json({ commands: pending });
    }

    return res.status(200).json({
      success: true,
      workout: currentWorkout
    });
  }

  // POST: Atualiza treino pelo Desktop ou envia comando do celular para o Garmin
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) {}
      }

      if (!body) {
        return res.status(400).json({ error: 'Payload vazio' });
      }

      // Ação 1: Celular enviando comando para enviar treino ao Garmin Connect / Relógio
      if (body.action === 'send_to_garmin') {
        currentWorkout.garmin_uploaded = true;
        currentWorkout.garmin_uploaded_at = new Date().toISOString();
        
        syncCommands.push({
          type: 'UPLOAD_GARMIN',
          workout_id: currentWorkout.id,
          timestamp: Date.now()
        });

        console.log('[API] Comando de envio para Garmin registrado!');
        return res.status(200).json({
          success: true,
          message: 'Comando enviado! Sincronizando com o Garmin Connect & Forerunner 965...',
          workout: currentWorkout
        });
      }

      // Ação 2: Concluir Treino (Gatilho do ARISE!)
      if (body.action === 'complete_workout') {
        currentWorkout.is_completed = true;
        currentWorkout.completed_at = new Date().toISOString();
        currentWorkout.attributes.str += 3;
        currentWorkout.attributes.agi += 4;
        currentWorkout.attributes.vit += 5;
        currentWorkout.exp_progress += 25;
        if (currentWorkout.exp_progress >= 100) {
          currentWorkout.hunter_level += 1;
          currentWorkout.exp_progress -= 100;
        }

        syncCommands.push({
          type: 'WORKOUT_COMPLETED',
          workout_id: currentWorkout.id,
          timestamp: Date.now()
        });

        console.log('[API] Treino concluído! Ritual ARISE ativado.');
        return res.status(200).json({
          success: true,
          message: '⚔️ ERGA-SE! Treino concluído com sucesso e sombras extraídas!',
          workout: currentWorkout
        });
      }

      // Ação 3: Desktop atualizando o treino do dia real
      if (body.action === 'sync_from_desktop' && body.workout) {
        currentWorkout = {
          ...currentWorkout,
          ...body.workout,
          updated_at: new Date().toISOString()
        };
        return res.status(200).json({
          success: true,
          message: 'Treino do dia atualizado com sucesso a partir do PC!',
          workout: currentWorkout
        });
      }

      return res.status(400).json({ error: 'Ação desconhecida' });
    } catch (err) {
      console.error('[API Error]', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
