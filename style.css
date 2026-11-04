
/* AMELIORATIONS PIXEL CLUB */

/* Snake : terrain plus grand */
#snakeCanvas {
    display: block;
    width: min(480px, 100%);
    height: auto;
    margin: 20px auto;
    border: 5px solid #344568;
    border-radius: 15px;
    background: #101a2b;
}

/* Commandes Snake */
#snakeButtons {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px;
    margin: 20px auto;
}

#snakeButtons button {
    min-width: 70px;
    min-height: 65px;
    padding: 12px;
    font-size: 1.8rem;
    touch-action: manipulation;
}

#snakeButtons button:active {
    transform: scale(.92);
}

/* Memory : grille adaptable */
.memory-grid {
    grid-template-columns: repeat(4, minmax(48px, 75px));
}

.memory-tile {
    min-width: 0;
    font-size: clamp(1.3rem, 5vw, 2rem);
}

/* Test de réflexes */
.reaction-box {
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
}

/* Puissance 4 */
#c4Columns {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
    width: min(490px, 100%);
    margin: 15px auto 8px;
}

.c4-column-button {
    padding: 8px 0;
    font-size: 1.3rem;
}

.connect4-board {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 7px;
    width: min(490px, 100%);
    margin: auto;
    padding: 12px;
    border-radius: 18px;
    background: #2457a6;
    box-shadow: 0 12px 30px #0005;
}

.c4-cell {
    width: 100%;
    aspect-ratio: 1;
    min-width: 0;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: #10172a;
    box-shadow: inset 0 3px 7px #0008;
}

.c4-cell:hover {
    transform: none;
    background: #18233b;
}

.c4-cell.red {
    background: #ff454f;
    box-shadow: inset 0 -4px 0 #a91f36;
}

.c4-cell.yellow {
    background: #ffdc45;
    box-shadow: inset 0 -4px 0 #b88c17;
}

/* Adaptation téléphone */
@media (max-width: 600px) {
    #snakeButtons {
        gap: 9px;
    }

    #snakeButtons button {
        min-width: 76px;
        min-height: 72px;
        font-size: 2rem;
    }

    #snakeCanvas {
        width: 100%;
    }

    .connect4-board {
        gap: 5px;
        padding: 8px;
    }

    #c4Columns {
        gap: 5px;
    }

    .c4-column-button {
        min-height: 48px;
    }
}
