document.addEventListener('DOMContentLoaded', () => {
    const btnBubble = document.getElementById('btn-bubble');
    const btnSelection = document.getElementById('btn-selection');
    const controlsArea = document.getElementById('controls');
    const gameInfo = document.getElementById('game-info');
    const actionArea = document.getElementById('action-area');
    const resultArea = document.getElementById('result-area');
    const currentAlgoTitle = document.getElementById('current-algo-title');
    const guideMessage = document.getElementById('guide-message');
    const cardsContainer = document.getElementById('cards-container');
    const btnOk = document.getElementById('btn-ok');
    const resultMessage = document.getElementById('result-message');
    const btnRetryDiff = document.getElementById('btn-retry-diff');
    const btnRetrySame = document.getElementById('btn-retry-same');

    let sortableInstance = null;
    let currentSteps = [];
    let currentStepIndex = 0;
    let moveCount = 0;
    let globalInitialArray = [];
    let currentAlgo = '';
    let currentEdgeCard = null;

    // ランダムな配列を生成 (5個、重複なし)
    function generateRandomArray() {
        const length = 5; 
        const arr = [];
        while (arr.length < length) {
            const num = Math.floor(Math.random() * 99) + 1;
            if (!arr.includes(num)) {
                arr.push(num);
            }
        }
        return arr;
    }

    // 初期化（ページロード時）
    function initApp() {
        globalInitialArray = generateRandomArray();
        renderCards(globalInitialArray, [], [], -1);
    }

    // 選択ソートのステップ履歴を生成
    function generateSelectionSortSteps(initialArray) {
        const steps = [];
        const tempArr = [...initialArray];
        const length = tempArr.length;
        for (let i = 0; i < length - 1; i++) {
            const startState = [...tempArr];
            let minIdx = i;
            for (let j = i + 1; j < length; j++) {
                if (tempArr[j] < tempArr[minIdx]) {
                    minIdx = j;
                }
            }

            const msg = `未整列部分から最小値を探し、左端のカードと入れ替えてください。（※始めから左端が最小ならそのままでOK。）`;
            const targetValues = [tempArr[i]]; 

            const fixedIndices = [];
            for (let k = 0; k < i; k++) {
                fixedIndices.push(k);
            }
            const edgeIndex = i;

            if (minIdx !== i) {
                const tmp = tempArr[i];
                tempArr[i] = tempArr[minIdx];
                tempArr[minIdx] = tmp;
            }

            const endState = [...tempArr];
            steps.push({ startState, endState, message: msg, targetValues, fixedIndices, edgeIndex });
        }
        return steps;
    }

    // バブルソートのステップ履歴を生成
    function generateBubbleSortSteps(initialArray) {
        const steps = [];
        const tempArr = [...initialArray];
        const length = tempArr.length;
        for (let i = 0; i < length - 1; i++) {
            for (let j = 0; j < length - i - 1; j++) {
                const startState = [...tempArr];
                const msg = `隣り合うカードを比較して、左が大きければ入れ替えてください。（※右が大きければそのままでOK。）`;
                const targetValues = [tempArr[j], tempArr[j+1]];

                const fixedIndices = [];
                for(let k = 0; k < i; k++) {
                    fixedIndices.push(length - 1 - k);
                }

                if (tempArr[j] > tempArr[j+1]) {
                    const tmp = tempArr[j];
                    tempArr[j] = tempArr[j+1];
                    tempArr[j+1] = tmp;
                }

                const endState = [...tempArr];
                steps.push({ startState, endState, message: msg, targetValues, fixedIndices, edgeIndex: -1 });
            }
        }
        return steps;
    }

    // ゲーム開始初期化処理
    function initGame(algo) {
        currentAlgo = algo;
        moveCount = 0;
        currentStepIndex = 0;

        if (algo === 'bubble') {
            currentAlgoTitle.textContent = 'バブルソート';
            currentSteps = generateBubbleSortSteps(globalInitialArray);
        } else if (algo === 'selection') {
            currentAlgoTitle.textContent = '選択ソート';
            currentSteps = generateSelectionSortSteps(globalInitialArray);
        }

        controlsArea.classList.add('hidden');
        gameInfo.classList.remove('hidden');
        actionArea.classList.remove('hidden');
        resultArea.classList.add('hidden');
        
        renderStep();
    }

    // 現在のステップを画面に描画
    function renderStep() {
        if (currentStepIndex >= currentSteps.length) {
            finishGame();
            return;
        }

        const step = currentSteps[currentStepIndex];
        guideMessage.textContent = step.message;
        renderCards(step.startState, step.targetValues, step.fixedIndices, step.edgeIndex);
    }

    // カード要素を描画し、SortableJSを適用
    function renderCards(arr, targetValues, fixedIndices, edgeIndex) {
        cardsContainer.innerHTML = '';
        arr.forEach((num, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            
            let isDraggable = true;

            if (fixedIndices.includes(index)) {
                card.classList.add('fixed');
                isDraggable = false;
            }
            
            if (currentAlgo === 'selection') {
                if (index === edgeIndex) {
                    card.classList.add('highlight');
                }
            } else {
                if (targetValues.includes(num)) {
                    card.classList.add('highlight');
                } else if (currentAlgo === 'bubble') {
                    // バブルソートでは強調されていないものはドラッグ不可
                    isDraggable = false;
                }
            }

            if (!isDraggable) {
                card.classList.add('not-draggable');
            }

            // 数字を全角に変換して表示
            card.textContent = String(num).replace(/[0-9]/g, s => String.fromCharCode(s.charCodeAt(0) + 0xFEE0));
            card.dataset.value = num;
            cardsContainer.appendChild(card);
        });

        if (sortableInstance) {
            sortableInstance.destroy();
        }

        sortableInstance = new Sortable(cardsContainer, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            swap: true,
            swapClass: 'highlight-swap',
            filter: '.not-draggable',
            onStart: function(evt) {
                if (currentAlgo === 'selection' && edgeIndex !== -1) {
                    currentEdgeCard = cardsContainer.children[edgeIndex];
                }
            },
            onMove: function(evt) {
                if (evt.related.classList.contains('not-draggable')) {
                    return false;
                }
                
                // 選択ソートでは、端のカードともう一枚のみ交換可能
                if (currentAlgo === 'selection' && currentEdgeCard) {
                    if (evt.dragged !== currentEdgeCard && evt.related !== currentEdgeCard) {
                        return false;
                    }
                }
            },
            onEnd: function(evt) {
                // 選択ソートの場合、ドラッグ(Swap)後に要素が入れ替わってハイライト位置がズレるため再設定する
                if (currentAlgo === 'selection' && edgeIndex !== -1) {
                    Array.from(cardsContainer.children).forEach(c => c.classList.remove('highlight'));
                    if (cardsContainer.children[edgeIndex]) {
                        cardsContainer.children[edgeIndex].classList.add('highlight');
                    }
                }
            }
        });
    }

    // 「これでOK」ボタン押下時の判定
    function checkAnswer() {
        const step = currentSteps[currentStepIndex];
        
        const currentCards = Array.from(cardsContainer.children);
        const currentArray = currentCards.map(card => parseInt(card.dataset.value, 10));

        const isCorrect = step.endState.every((val, index) => val === currentArray[index]);
        moveCount++;

        if (isCorrect) {
            currentStepIndex++;
            renderStep();
        } else {
            // アニメーションのリセットと再適用を確実に行う
            cardsContainer.classList.remove('shake');
            void cardsContainer.offsetWidth; // リフローを強制
            cardsContainer.classList.add('shake');
            
            setTimeout(() => {
                cardsContainer.classList.remove('shake');
                // アラートは出さずに自動で戻す
                renderCards(step.startState, step.targetValues, step.fixedIndices, step.edgeIndex);
            }, 400); 
        }
    }

    // 終了処理
    function finishGame() {
        actionArea.classList.add('hidden');
        resultArea.classList.remove('hidden');
        resultMessage.textContent = `完了しました。比較回数は${moveCount}回でした。`;
        
        // 全ての位置を確定として描画
        const allIndices = globalInitialArray.map((_, i) => i);
        const lastState = currentSteps[currentSteps.length - 1].endState;
        renderCards(lastState, [], allIndices, -1);
        
        // 操作を無効化
        if (sortableInstance) {
            sortableInstance.options.disabled = true;
        }
    }

    // リセット処理
    function resetAppDiff() {
        globalInitialArray = generateRandomArray();
        resetUI();
    }
    
    function resetAppSame() {
        resetUI();
    }

    function resetUI() {
        controlsArea.classList.remove('hidden');
        resultArea.classList.add('hidden');
        gameInfo.classList.add('hidden');
        actionArea.classList.add('hidden');
        currentAlgo = '';
        renderCards(globalInitialArray, [], [], -1);
    }

    btnBubble.addEventListener('click', () => initGame('bubble'));
    btnSelection.addEventListener('click', () => initGame('selection'));
    btnOk.addEventListener('click', checkAnswer);
    btnRetryDiff.addEventListener('click', resetAppDiff);
    btnRetrySame.addEventListener('click', resetAppSame);
    
    // アプリ初期化
    initApp();
});
