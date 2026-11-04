import Phaser from 'phaser';
import { ensureTexture } from '../art';
import { playSound } from '../audio';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { addHat, HAT_COLORS } from '../features/hats';
import { buy, getCorn, getHat, owns, setHat } from '../save';
import { TEXT } from '../text';
import { addButton, addCornCount, addText } from '../ui';
import { SHOP_ITEMS } from '../upgrades';

type ShopItem = (typeof SHOP_ITEMS)[number];

const COLUMNS = 2;
const CARD_WIDTH = 304;
const CARD_HEIGHT = 58;
const FIRST_ROW_Y = 94;
const ROW_STEP = 63;
const ICON_SIZE = 32;
const UPGRADE_ICON_COLOR = 0x7fb8e0;
const COLORS = { text: '#ffffff', button: '#ffe14d', good: '#8be37a', poor: '#ff8a80', muted: '#8a8ea3' };

interface Card {
  item: ShopItem;
  frame: Phaser.GameObjects.Rectangle;
  price: Phaser.GameObjects.Text;
  priceIcon: Phaser.GameObjects.Image;
  action: Phaser.GameObjects.Text;
}

// Opened from the menu, or from the level-complete screen, which sleeps until the shop closes.
export class ShopScene extends Phaser.Scene {
  private from: 'menu' | 'level-complete' = 'menu';
  private cards: Card[] = [];
  private backButton!: Phaser.GameObjects.Text;
  private selected = 0;
  private wallet!: Phaser.GameObjects.Text;
  private message!: Phaser.GameObjects.Text;
  private chicken!: Phaser.GameObjects.Sprite;
  private hat: Phaser.GameObjects.Image | null = null;

  constructor() {
    super('shop');
  }

  create(data: { from?: 'menu' | 'level-complete' }) {
    this.from = data.from ?? 'menu';
    this.selected = 0;
    // Blocks clicks from reaching the scenes underneath.
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x2a2f45).setOrigin(0).setInteractive();

    this.chicken = this.add.sprite(34, 38, 'chicken').setScale(1.5);
    this.hat = addHat(this, this.chicken);
    addText(this, GAME_WIDTH / 2, 26, TEXT.shop, 28, '#ffe14d');
    this.wallet = addCornCount(this, GAME_WIDTH - 92, 26, getCorn(), 18);
    const usesTouch = this.sys.game.device.input.touch;
    addText(this, GAME_WIDTH / 2, 52, usesTouch ? TEXT.shopTouchHint : TEXT.shopHint, 10, COLORS.muted);

    this.cards = SHOP_ITEMS.map((item, index) => this.addCard(item, index));
    this.backButton = addButton(this, 52, GAME_HEIGHT - 22, TEXT.back, () => this.goBack());
    this.message = addText(this, GAME_WIDTH / 2 + 40, GAME_HEIGHT - 22, '', 12);
    this.refresh();

    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-LEFT', () => this.moveSelection(-1));
    keyboard.on('keydown-RIGHT', () => this.moveSelection(1));
    keyboard.on('keydown-UP', () => this.moveSelection(-COLUMNS));
    keyboard.on('keydown-DOWN', () => this.moveSelection(COLUMNS));
    keyboard.on('keydown-ENTER', () => this.activate());
    keyboard.on('keydown-SPACE', () => this.activate());
    keyboard.on('keydown-ESC', () => this.goBack());
  }

  private addCard(item: ShopItem, index: number): Card {
    const x = GAME_WIDTH / 2 + ((index % COLUMNS) - 0.5) * (CARD_WIDTH + 8);
    const y = FIRST_ROW_Y + Math.floor(index / COLUMNS) * ROW_STEP;
    const left = x - CARD_WIDTH / 2;
    const text = TEXT.shopItems[item.id];

    const frame = this.add.rectangle(x, y, CARD_WIDTH, CARD_HEIGHT, 0x1d2030, 0.9).setInteractive({ useHandCursor: true });
    frame.on('pointerdown', () => {
      if (this.selected === index) this.activate();
      else this.select(index);
    });
    const color = item.kind === 'hat' ? HAT_COLORS[item.id] : UPGRADE_ICON_COLOR;
    this.add.image(left + 26, y, ensureTexture(this, `shop-${item.id}`, color, ICON_SIZE, ICON_SIZE));
    addText(this, left + 50, y - 15, text.name, 13).setOrigin(0, 0.5);
    addText(this, left + 50, y + 2, text.description, 10, '#d6d8e4')
      .setOrigin(0, 0)
      .setWordWrapWidth(160);

    const priceIcon = this.add.image(left + 238, y - 13, 'corn');
    const price = addText(this, left + 250, y - 13, String(item.price), 13).setOrigin(0, 0.5);
    const action = addText(this, left + 262, y + 13, '', 12).setPadding(8, 4);
    action.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      this.select(index);
      this.activate();
    });
    return { item, frame, price, priceIcon, action };
  }

  private refresh() {
    const corn = getCorn();
    this.wallet.setText(String(corn));
    for (const card of this.cards) {
      const { item, price, priceIcon, action } = card;
      const owned = owns(item.id);
      const worn = getHat() === item.id;
      priceIcon.setVisible(!owned);
      price.setVisible(true);
      if (!owned) {
        price.setText(String(item.price)).setColor(corn >= item.price ? COLORS.text : COLORS.poor).setX(priceIcon.x + 12);
        if (corn >= item.price) action.setText(TEXT.buy).setColor(COLORS.button);
        else action.setText(TEXT.need(item.price - corn)).setColor(COLORS.muted);
      } else if (item.kind === 'hat') {
        price.setText(worn ? TEXT.worn : TEXT.owned).setColor(COLORS.good).setX(priceIcon.x - 8);
        action.setText(worn ? TEXT.takeOff : TEXT.wear).setColor(COLORS.button);
      } else {
        price.setVisible(false);
        action.setText(TEXT.owned).setColor(COLORS.good);
      }
    }
    this.cards.forEach((card, index) => {
      card.frame.setStrokeStyle(2, index === this.selected ? 0xffe14d : 0x4a4e63);
    });
    this.backButton.setColor(this.selected === this.cards.length ? '#ffffff' : '#ffe14d');
    this.backButton.setText(this.selected === this.cards.length ? `> ${TEXT.back}` : TEXT.back);

    this.hat?.destroy();
    this.hat = addHat(this, this.chicken);
  }

  private select(index: number) {
    this.selected = index;
    this.refresh();
  }

  // The Back button comes after the last card.
  private moveSelection(step: number) {
    const back = this.cards.length;
    if (this.selected === back) this.select(step < 0 ? back - 1 : back);
    else this.select(Phaser.Math.Clamp(this.selected + step, 0, back));
  }

  private activate() {
    const card = this.cards[this.selected];
    if (!card) {
      this.goBack();
      return;
    }
    const { item } = card;
    const name = TEXT.shopItems[item.id].name;
    if (!owns(item.id)) {
      const short = item.price - getCorn();
      if (buy(item.id, item.price)) {
        playSound(this, 'sfx-buy');
        if (item.kind === 'hat') setHat(item.id);
        this.say(TEXT.bought(name), COLORS.good);
        this.pop(this.wallet);
        this.pop(card.action);
      } else {
        this.say(TEXT.tooExpensive(short), COLORS.poor);
        this.shake(card);
      }
    } else if (item.kind === 'hat') {
      const worn = getHat() === item.id;
      setHat(worn ? null : item.id);
      this.say(worn ? TEXT.hatOff : TEXT.wearing(name), COLORS.text);
    } else {
      this.say(TEXT.alreadyOwned, COLORS.text);
    }
    this.refresh();
  }

  private say(text: string, color: string) {
    this.message.setText(text).setColor(color).setAlpha(1);
    this.tweens.killTweensOf(this.message);
    this.tweens.add({ targets: this.message, alpha: 0, delay: 2500, duration: 400 });
  }

  private pop(target: Phaser.GameObjects.Text) {
    this.tweens.add({ targets: target, scale: 1.3, duration: 120, yoyo: true });
  }

  private shake(card: Card) {
    const x = card.frame.x;
    this.tweens.add({
      targets: card.frame,
      x: x + 4,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => card.frame.setX(x),
    });
  }

  private goBack() {
    if (this.from === 'level-complete') {
      this.scene.stop();
      this.scene.wake('hud');
      this.scene.wake('level-complete');
    } else {
      this.scene.start('menu');
    }
  }
}
