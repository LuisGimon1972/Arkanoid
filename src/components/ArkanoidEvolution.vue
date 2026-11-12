<template>
  <q-page
    class="flex flex-center arcade-bg text-white q-pa-sm column justify-start"
    style="min-height: 100vh; overflow-y: auto"
    @click="focusGame"
  >
    <div
      ref="wrapperRef"
      class="column items-center justify-center q-gutter-sm arkanoid-main-wrapper q-my-md"
      tabindex="0"
    >
      <h5 style="margin-top: -10px">Arkanoid Evolution Game</h5>
      <q-card
        style="margin-top: -35px"
        flat
        class="glass-hud q-px-sm q-py-none full-width shadow-6"
      >
        <div
          class="row justify-between items-center text-weight-bold"
          style="font-size: 12px; line-height: 1"
        >
          <div>
            🏆 Pontos: <span class="text-green-4">{{ score }}</span>
          </div>
          <div>
            📈 Nível: <span class="text-amber-4">{{ level }}</span>
          </div>
          <div>
            ❤️ Vidas: <span class="text-red-4">{{ lives }}</span>
          </div>
        </div>
      </q-card>

      <div class="arkanoid-container relative-position shadow-20">
        <canvas ref="canvasRef" width="480" height="640" class="arkanoid-canvas"></canvas>

        <!-- Overlay de Fim de Jogo / Vitória -->
        <div
          v-if="isGameOver || isVictory"
          class="absolute-full flex flex-center overlay-bg column q-gutter-md rounded-borders q-pa-md"
        >
          <div
            class="text-h5 text-weight-bold text-center"
            :class="isVictory ? 'text-green-4' : 'text-red-5'"
          >
            {{ isVictory ? '🎉 VITÓRIA ÉPICA! 🎉' : '⚠️ GAME OVER ⚠️' }}
          </div>
          <q-btn
            class="action-btn"
            color="amber-6"
            text-color="dark"
            icon="replay"
            label="Jogar de Novo"
            @click="restartGame"
          />
        </div>
      </div>

      <div class="row items-center justify-between full-width q-px-md q-mt-xs">
        <div class="row q-gutter-sm">
          <q-btn
            color="amber-8"
            text-color="dark"
            icon="arrow_back"
            dense
            unelevated
            class="arcade-key"
            @touchstart.prevent="setTouchMove('left', true)"
            @touchend.prevent="setTouchMove('left', false)"
            @mousedown.prevent="setTouchMove('left', true)"
            @mouseup.prevent="setTouchMove('left', false)"
            @mouseleave.prevent="setTouchMove('left', false)"
          />
          <q-btn
            color="amber-8"
            text-color="dark"
            icon="arrow_forward"
            dense
            unelevated
            class="arcade-key"
            @touchstart.prevent="setTouchMove('right', true)"
            @touchend.prevent="setTouchMove('right', false)"
            @mousedown.prevent="setTouchMove('right', true)"
            @mouseup.prevent="setTouchMove('right', false)"
            @mouseleave.prevent="setTouchMove('right', false)"
          />
        </div>

        <q-btn
          color="purple-8"
          text-color="white"
          icon="history"
          label="Reiniciar"
          dense
          unelevated
          class="action-btn q-px-sm"
          @click="triggerRewind"
        />

        <q-btn
          color="deep-orange-9"
          text-color="white"
          icon="exit_to_app"
          label="Sair"
          dense
          unelevated
          class="action-btn q-px-sm"
          @click="exitGame"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ArkanoidEngine } from '../game/arkanoidEngine';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);

let engine: ArkanoidEngine | null = null;
let animationFrameId: number | null = null;

const score = ref(0);
const lives = ref(3);
const level = ref(1);
const isGameOver = ref(false);
const isVictory = ref(false);
const keys = { left: false, right: false };

const updateDirection = () => {
  if (!engine) return;
  if (keys.left && !keys.right) engine.moveDir = 'left';
  else if (keys.right && !keys.left) engine.moveDir = 'right';
  else engine.moveDir = 'none';
};

const focusGame = () => {
  if (wrapperRef.value) {
    wrapperRef.value.focus({ preventScroll: true });
  }
};

const setTouchMove = (dir: 'left' | 'right', isDown: boolean) => {
  if (dir === 'left') keys.left = isDown;
  if (dir === 'right') keys.right = isDown;
  updateDirection();
  focusGame();
};

const triggerRewind = () => {
  restartGame();
};

const exitGame = () => {
  window.close();
  setTimeout(() => {
    router.push('/');
  }, 100);
};

const restartGame = () => {
  if (engine) {
    engine.score = 0;
    engine.lives = 3;
    engine.level = 1;
    engine.isGameOver = false;
    engine.isVictory = false;
    engine.initLevel();
  }
  focusGame();
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
    e.preventDefault();
    e.stopPropagation();
  }

  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
  updateDirection();

  if (e.key === ' ' && engine) {
    engine.triggerRestart();
  }
};

const handleKeyUp = (e: KeyboardEvent) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
    e.preventDefault();
    e.stopPropagation();
  }

  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
  updateDirection();
};

const gameLoop = () => {
  if (engine && canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d');
    if (ctx) {
      engine.update();
      engine.render(ctx);

      score.value = engine.score;
      lives.value = engine.lives;
      level.value = engine.level;
      isGameOver.value = engine.isGameOver;
      isVictory.value = engine.isVictory;
    }
  }
  animationFrameId = requestAnimationFrame(gameLoop);
};

onMounted(() => {
  window.scrollTo(0, 0);

  if (canvasRef.value) {
    engine = new ArkanoidEngine();
    gameLoop();
  }

  // Captura os eventos de teclado globalmente em toda a janela
  window.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('keyup', handleKeyUp, true);
  window.addEventListener('click', focusGame);

  // Força o foco imediato assim que o componente é montado na tela
  setTimeout(() => {
    window.scrollTo(0, 0);
    focusGame();
    if (wrapperRef.value) {
      wrapperRef.value.focus();
    }
  }, 100);
});

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  window.removeEventListener('keydown', handleKeyDown, true);
  window.removeEventListener('keyup', handleKeyUp, true);
  window.removeEventListener('click', focusGame);
});
</script>

<style scoped>
.arcade-bg {
  width: 100%;
  min-height: 100vh;
  background-color: #030712;
  background-image: radial-gradient(
    circle at 50% 20%,
    rgba(30, 41, 59, 0.8) 0%,
    rgba(3, 7, 18, 1) 100%
  );
  overflow-y: auto;
}

.arkanoid-main-wrapper {
  max-width: 420px;
  width: 100%;
  margin: 0 auto;
  outline: none;
}

.glass-hud {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  padding-top: 0px !important;
  padding-bottom: 0px !important;
  min-height: 10px !important;
}

.arkanoid-container {
  background-color: #0b0f19;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  overflow: hidden;
}

.arkanoid-canvas {
  display: block;
  width: 100%;
  height: auto;
  max-height: 520px;
}

.arcade-key {
  width: 50px;
  height: 40px;
}

.action-btn {
  font-size: 11px;
  border-radius: 6px;
}

.overlay-bg {
  background-color: rgba(3, 7, 18, 0.94);
  backdrop-filter: blur(8px);
  z-index: 10;
}

/* ==========================================================
   RESPONSIVIDADE PARA TABLETS E PHONES (Sem tocar no Desktop)
   ========================================================== */

/* Telemóveis / Phones em modo retrato (Ecrãs até 480px) */
@media (max-width: 480px) {
  .arcade-bg {
    padding: 4px !important;
  }
  .arkanoid-main-wrapper {
    max-width: 100% !important;
    padding: 0 2px;
  }
  .arkanoid-canvas {
    max-height: 480px; /* Ajusta proporcionalmente para caber inteiro em ecrãs verticais de telemóvel */
  }
  .arcade-key {
    width: 46px;
    height: 38px;
  }
  h5 {
    font-size: 1.05rem;
  }
}

/* Tablets e Ecrãs Médios (Entre 481px e 1024px) */
@media (min-width: 481px) and (max-width: 1024px) {
  .arkanoid-main-wrapper {
    max-width: 460px;
  }
  .arkanoid-canvas {
    max-height: 520px;
  }
  .arcade-key {
    width: 58px;
    height: 44px;
  }
}
</style>
