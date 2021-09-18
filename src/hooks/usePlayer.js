import { useState } from "react";
import { getMove } from "../api/api";
import { ACTIONS, PHASE, STRAGEGIES } from "../utils/constants";

const usePlayer = ({ showCards }) => {
  const [player, setPlayer] = useState({
    name: "",
    cards: [],
    bet: 0,
    availableMoney: 0,
    isHuman: undefined,
    strategy: undefined,
    isDealer: false,
  });

  const setHand = (hand) =>
    setPlayer((prev) => ({
      ...prev,
      cards: hand.map((card) => ({ card, shown: !!showCards })),
    }));
  const setMoney = (money) =>
    setPlayer((prev) => ({ ...prev, availableMoney: money }));
  const isComputer = () =>
    setPlayer((prev) => ({ ...prev, isHuman: false, name: "Computadora" }));
  const isHuman = () =>
    setPlayer((prev) => ({ ...prev, isHuman: true, name: "Humano" }));
  const bet = (money) => {
    setPlayer((prev) => ({
      ...prev,
      bet: prev.bet + money,
      availableMoney: prev.availableMoney - money,
    }));
  };
  const setStrategy = (q) => {
    const rand = Math.random();
    if (rand < q) {
      setPlayer((prev) => ({ ...prev, strategy: STRAGEGIES.LIE }));
    } else {
      setPlayer((prev) => ({ ...prev, strategy: STRAGEGIES.THINK }));
    }
  };

  const raise = (game) => {
    const betLimit =
      game.state.bigBlind *
      ([PHASE.Turn, PHASE.River].includes(game.state.phase) ? 2 : 1);

    const newBet = game.state.bet + betLimit;

    setPlayer((prev) => ({
      ...prev,
      availableMoney: prev.availableMoney - newBet + prev.bet,
      bet: newBet,
    }));
    game.addToPot(newBet);
    game.raiseBet(newBet);
  };
  const call = (game) => {
    const newBet = game.state.bet - player.bet;
    setPlayer((prev) => ({
      ...prev,
      availableMoney: prev.availableMoney - newBet,
      bet: prev.bet + newBet,
    }));
    game.addToPot(newBet);
  };
  const fold = (game) => {
    game.finishGame();
  };
  const play = (game, decision) => {
    game.advance(decision);
    setPlayer((prev) => ({ ...prev, lastAction: decision }));
    switch (decision) {
      case ACTIONS.FOLD:
        fold(game);
        return false;
      case ACTIONS.CHECK:
      case ACTIONS.CALL:
        call(game);
        break;
      case ACTIONS.BET:
      case ACTIONS.RAISE:
        raise(game);
        break;
    }
    return true;
  };
  const playAutomatically = async (game) => {
    const options = game.getOptions();

    const decision = await getMove(
      player.cards.map((c) => c.card),
      game.state.tableCards.filter((c) => c.shown).map((c) => c.card),
      player.strategy,
      game.state.phase,
      options,
      game.state.initialChips,
      player.availableMoney
    );
    console.log("Computer decide do ", decision, " bip bop");
    return play(game, decision);
  };
  const setIsDealer = () => setPlayer((prev) => ({ ...prev, isDealer: true }));

  const clearLastAction = () =>
    setPlayer((prev) => ({ ...prev, lastAction: undefined }));

  const clearBet = () => setPlayer((prev) => ({ ...prev, bet: 0 }));
  return {
    player,
    setHand,
    isComputer,
    isHuman,
    setMoney,
    bet,
    setStrategy,
    play,
    playAutomatically,
    setIsDealer,
    clearLastAction,
    clearBet,
  };
};
export default usePlayer;
