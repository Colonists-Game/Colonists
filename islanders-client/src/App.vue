<template>
  <v-app id="app">
    <StartGame v-if="!showGame" />
    <Game
      v-if="showGame"
      id="game"
    />
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Game from './components/Game.vue'
import StartGame from './components/StartGame.vue'

@Component({
  components: {
    Game,
    StartGame,
  },
})
export default class App extends Vue {
  public showGame = false;

  public created (): void {
    this.$on('gameChosen', () => {
      this.showGame = true
    })
  }
}
</script>

<style lang="scss">
#app {
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}

#game {
  padding: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
