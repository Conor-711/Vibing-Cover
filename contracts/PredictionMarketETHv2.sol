// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PredictionMarketETHv2 is ReentrancyGuard {

    enum TopicStatus {
        WAITING_FOR_SECOND_PLAYER,  // 等待第二个玩家
        ACTIVE,                     // 活跃状态（两个玩家都已加入）
        RESOLVED,                   // 已裁定结果
        CLAIMED                     // 奖金已领取
    }

    // 基础议题结构（保持向后兼容）
    struct Topic {
        uint256 id;
        address creator;
        string title;
        string[] options;
        uint256 betAmount;          // 固定投入金额 (ETH)
        address[2] players;         // 只允许2个玩家
        uint256[2] playerChoices;   // 玩家选择的选项索引
        uint256 totalPool;          // 资金池 (ETH)
        TopicStatus status;
        uint256 winningOption;      // 获胜选项索引
        address winner;             // 获胜者地址
        bool isComposite;           // 是否为组合议题
    }

    // 组合议题的投注信息
    struct CompositeBet {
        address bettor;
        uint256 amount;
        uint256 optionIndex;
        uint256 timestamp;
    }

    // 组合议题结构
    struct CompositeTopic {
        uint256 id;
        address creator;
        string title;
        uint256[] referencedTopicIds;  // 引用的原始议题ID
        string[] combinedOptions;      // 组合后的选项描述
        uint256 minBetAmount;          // 最低投注金额
        uint256 totalPool;             // 总资金池
        TopicStatus status;
        uint256 winningOption;         // 获胜选项索引
        uint256 createdAt;             // 创建时间
    }

    // 状态变量
    uint256 public nextTopicId;
    mapping(uint256 => Topic) public topics;
    mapping(uint256 => CompositeTopic) public compositeTopics;
    uint256[] public topicIds;
    uint256[] public compositeTopicIds;

    // 组合议题的投注映射
    mapping(uint256 => CompositeBet[]) public compositeBets; // topicId => bets array
    mapping(uint256 => mapping(uint256 => uint256)) public optionTotalBets; // topicId => optionIndex => total amount
    mapping(uint256 => mapping(address => mapping(uint256 => uint256))) public userBets; // topicId => user => optionIndex => amount

    // 事件
    event TopicCreated(uint256 indexed topicId, address indexed creator, string title, uint256 betAmount);
    event CompositeTopicCreated(uint256 indexed topicId, address indexed creator, string title, uint256[] referencedTopics);
    event PlayerJoined(uint256 indexed topicId, address indexed player, uint256 choice);
    event CompositeBetPlaced(uint256 indexed topicId, address indexed bettor, uint256 optionIndex, uint256 amount);
    event TopicResolved(uint256 indexed topicId, uint256 winningOption, address winner);
    event CompositeTopicResolved(uint256 indexed topicId, uint256 winningOption, uint256 totalPayout);
    event RewardClaimed(uint256 indexed topicId, address indexed winner, uint256 amount);

    constructor() {
        nextTopicId = 1;
    }

    /**
     * @dev 创建基础议题（保持原有逻辑）
     */
    function createTopic(
        string memory title,
        string[] memory options,
        uint256 choice
    ) external payable nonReentrant {
        require(options.length >= 2, "At least 2 options required");
        require(choice < options.length, "Invalid choice");
        require(msg.value > 0, "Bet amount must be greater than 0");

        uint256 topicId = nextTopicId++;

        Topic storage newTopic = topics[topicId];
        newTopic.id = topicId;
        newTopic.creator = msg.sender;
        newTopic.title = title;
        newTopic.options = options;
        newTopic.betAmount = msg.value;
        newTopic.players[0] = msg.sender;
        newTopic.playerChoices[0] = choice;
        newTopic.status = TopicStatus.WAITING_FOR_SECOND_PLAYER;
        newTopic.totalPool = msg.value;
        newTopic.isComposite = false;

        topicIds.push(topicId);

        emit TopicCreated(topicId, msg.sender, title, msg.value);
    }

    /**
     * @dev 创建组合议题
     * @param title 组合议题标题
     * @param referencedTopicIds 引用的议题ID数组
     * @param minBetAmount 最低投注金额
     */
    function createCompositeTopic(
        string memory title,
        uint256[] memory referencedTopicIds,
        uint256 minBetAmount
    ) external nonReentrant {
        require(referencedTopicIds.length >= 2, "At least 2 topics required for combination");
        require(referencedTopicIds.length <= 5, "Maximum 5 topics can be combined");
        require(minBetAmount > 0, "Min bet amount must be greater than 0");

        // 验证引用的议题都存在且可用于组合
        uint256[] memory optionCounts = new uint256[](referencedTopicIds.length);
        for (uint256 i = 0; i < referencedTopicIds.length; i++) {
            uint256 refTopicId = referencedTopicIds[i];
            require(topics[refTopicId].id != 0, "Referenced topic does not exist");
            require(!topics[refTopicId].isComposite, "Cannot reference composite topics");
            require(
                topics[refTopicId].status == TopicStatus.WAITING_FOR_SECOND_PLAYER || 
                topics[refTopicId].status == TopicStatus.ACTIVE,
                "Referenced topic is not available"
            );
            optionCounts[i] = topics[refTopicId].options.length;
        }

        uint256 topicId = nextTopicId++;

        // 生成组合选项
        string[] memory combinedOptions = generateCombinedOptions(referencedTopicIds, optionCounts);

        CompositeTopic storage newCompositeTopic = compositeTopics[topicId];
        newCompositeTopic.id = topicId;
        newCompositeTopic.creator = msg.sender;
        newCompositeTopic.title = title;
        newCompositeTopic.referencedTopicIds = referencedTopicIds;
        newCompositeTopic.combinedOptions = combinedOptions;
        newCompositeTopic.minBetAmount = minBetAmount;
        newCompositeTopic.status = TopicStatus.ACTIVE;
        newCompositeTopic.createdAt = block.timestamp;

        // 将组合议题ID也添加到topicIds中，但标记为组合议题
        Topic storage topicMarker = topics[topicId];
        topicMarker.id = topicId;
        topicMarker.isComposite = true;

        compositeTopicIds.push(topicId);
        topicIds.push(topicId);

        emit CompositeTopicCreated(topicId, msg.sender, title, referencedTopicIds);
    }

    /**
     * @dev 生成组合选项（内部函数）
     */
    function generateCombinedOptions(
        uint256[] memory referencedTopicIds,
        uint256[] memory optionCounts
    ) internal view returns (string[] memory) {
        // 计算总组合数
        uint256 totalCombinations = 1;
        for (uint256 i = 0; i < optionCounts.length; i++) {
            totalCombinations *= optionCounts[i];
        }

        string[] memory combinedOptions = new string[](totalCombinations);

        // 生成所有可能的组合
        for (uint256 combo = 0; combo < totalCombinations; combo++) {
            string memory optionDescription = "";
            uint256 temp = combo;

            for (uint256 i = 0; i < referencedTopicIds.length; i++) {
                uint256 topicIndex = referencedTopicIds.length - 1 - i;
                uint256 optionIndex = temp % optionCounts[topicIndex];
                temp /= optionCounts[topicIndex];

                string memory topicTitle = topics[referencedTopicIds[topicIndex]].title;
                string memory optionText = topics[referencedTopicIds[topicIndex]].options[optionIndex];

                if (i > 0) {
                    optionDescription = string(abi.encodePacked(optionDescription, " & "));
                }
                optionDescription = string(abi.encodePacked(
                    optionDescription,
                    topicTitle,
                    ": ",
                    optionText
                ));
            }

            combinedOptions[combo] = optionDescription;
        }

        return combinedOptions;
    }

    /**
     * @dev 对组合议题的某个选项下注
     * @param topicId 组合议题ID
     * @param optionIndex 选项索引
     */
    function betOnCompositeOption(uint256 topicId, uint256 optionIndex) 
        external payable nonReentrant {
        CompositeTopic storage compositeTopic = compositeTopics[topicId];
        require(compositeTopic.id != 0, "Composite topic does not exist");
        require(compositeTopic.status == TopicStatus.ACTIVE, "Topic not active");
        require(optionIndex < compositeTopic.combinedOptions.length, "Invalid option index");
        require(msg.value >= compositeTopic.minBetAmount, "Bet amount below minimum");

        // 记录投注
        CompositeBet memory newBet = CompositeBet({
            bettor: msg.sender,
            amount: msg.value,
            optionIndex: optionIndex,
            timestamp: block.timestamp
        });

        compositeBets[topicId].push(newBet);
        optionTotalBets[topicId][optionIndex] += msg.value;
        userBets[topicId][msg.sender][optionIndex] += msg.value;
        compositeTopic.totalPool += msg.value;

        emit CompositeBetPlaced(topicId, msg.sender, optionIndex, msg.value);
    }

    /**
     * @dev 加入基础议题（保持原有逻辑）
     */
    function joinTopic(uint256 topicId, uint256 choice) external payable nonReentrant {
        Topic storage topic = topics[topicId];
        
        require(topic.id != 0, "Topic does not exist");
        require(!topic.isComposite, "Cannot join composite topic directly");
        require(topic.status == TopicStatus.WAITING_FOR_SECOND_PLAYER, "Topic not available for joining");
        require(msg.sender != topic.creator, "Creator cannot join own topic");
        require(choice < topic.options.length, "Invalid choice");
        require(msg.value == topic.betAmount, "Incorrect bet amount");

        topic.players[1] = msg.sender;
        topic.playerChoices[1] = choice;
        topic.status = TopicStatus.ACTIVE;
        topic.totalPool += msg.value;

        emit PlayerJoined(topicId, msg.sender, choice);
    }

    /**
     * @dev 解决组合议题
     * @param topicId 组合议题ID
     */
    function resolveCompositeTopic(uint256 topicId) external {
        CompositeTopic storage compositeTopic = compositeTopics[topicId];
        require(compositeTopic.id != 0, "Composite topic does not exist");
        require(msg.sender == compositeTopic.creator, "Only creator can resolve");
        require(compositeTopic.status == TopicStatus.ACTIVE, "Topic not active");

        // 检查所有引用的议题是否都已解决
        uint256[] memory referencedResults = new uint256[](compositeTopic.referencedTopicIds.length);
        for (uint256 i = 0; i < compositeTopic.referencedTopicIds.length; i++) {
            uint256 refTopicId = compositeTopic.referencedTopicIds[i];
            Topic storage refTopic = topics[refTopicId];
            require(refTopic.status == TopicStatus.RESOLVED, "Referenced topic not resolved");
            referencedResults[i] = refTopic.winningOption;
        }

        // 计算获胜的组合选项索引
        uint256 winningOptionIndex = calculateWinningCombination(
            compositeTopic.referencedTopicIds,
            referencedResults
        );

        compositeTopic.status = TopicStatus.RESOLVED;
        compositeTopic.winningOption = winningOptionIndex;

        emit CompositeTopicResolved(topicId, winningOptionIndex, compositeTopic.totalPool);
    }

    /**
     * @dev 计算获胜组合的索引
     */
    function calculateWinningCombination(
        uint256[] memory referencedTopicIds,
        uint256[] memory results
    ) internal view returns (uint256) {
        uint256 combinationIndex = 0;
        uint256 multiplier = 1;

        for (uint256 i = referencedTopicIds.length; i > 0; i--) {
            uint256 topicIndex = i - 1;
            combinationIndex += results[topicIndex] * multiplier;
            multiplier *= topics[referencedTopicIds[topicIndex]].options.length;
        }

        return combinationIndex;
    }

    /**
     * @dev 领取组合议题奖金
     * @param topicId 组合议题ID
     */
    function claimCompositeReward(uint256 topicId) external nonReentrant {
        CompositeTopic storage compositeTopic = compositeTopics[topicId];
        require(compositeTopic.id != 0, "Composite topic does not exist");
        require(compositeTopic.status == TopicStatus.RESOLVED, "Topic not resolved");

        uint256 winningOption = compositeTopic.winningOption;
        uint256 userBetAmount = userBets[topicId][msg.sender][winningOption];
        require(userBetAmount > 0, "No winning bet found");

        // 计算用户应得奖金（按比例分配）
        uint256 totalWinningBets = optionTotalBets[topicId][winningOption];
        require(totalWinningBets > 0, "No winning bets");

        uint256 userReward = (compositeTopic.totalPool * userBetAmount) / totalWinningBets;
        
        // 清除用户的投注记录防止重复领取
        userBets[topicId][msg.sender][winningOption] = 0;

        // 转账给用户
        (bool success, ) = payable(msg.sender).call{value: userReward}("");
        require(success, "Transfer failed");

        emit RewardClaimed(topicId, msg.sender, userReward);
    }

    /**
     * @dev 裁定基础议题结果（保持原有逻辑）
     */
    function resolveTopic(uint256 topicId, uint256 winningOption) external {
        Topic storage topic = topics[topicId];
        
        require(topic.id != 0, "Topic does not exist");
        require(!topic.isComposite, "Use resolveCompositeTopic for composite topics");
        require(msg.sender == topic.creator, "Only creator can resolve");
        require(topic.status == TopicStatus.ACTIVE, "Topic not active");
        require(winningOption < topic.options.length, "Invalid winning option");

        topic.status = TopicStatus.RESOLVED;
        topic.winningOption = winningOption;

        // 确定获胜者
        if (topic.playerChoices[0] == winningOption) {
            topic.winner = topic.players[0];
        } else if (topic.playerChoices[1] == winningOption) {
            topic.winner = topic.players[1];
        } else {
            // 如果没有玩家选择获胜选项，资金返还给创建者
            topic.winner = topic.creator;
        }

        emit TopicResolved(topicId, winningOption, topic.winner);
    }

    /**
     * @dev 领取基础议题奖金（保持原有逻辑）
     */
    function claimReward(uint256 topicId) external nonReentrant {
        Topic storage topic = topics[topicId];
        
        require(topic.id != 0, "Topic does not exist");
        require(!topic.isComposite, "Use claimCompositeReward for composite topics");
        require(topic.status == TopicStatus.RESOLVED, "Topic not resolved");
        require(msg.sender == topic.winner, "Only winner can claim");

        topic.status = TopicStatus.CLAIMED;

        uint256 reward = topic.totalPool;
        (bool success, ) = payable(topic.winner).call{value: reward}("");
        require(success, "Transfer failed");

        emit RewardClaimed(topicId, topic.winner, reward);
    }

    // 查询函数保持不变，添加组合议题的查询函数...
    
    /**
     * @dev 获取组合议题详情
     */
    function getCompositeTopic(uint256 topicId) external view returns (
        uint256 id,
        address creator,
        string memory title,
        uint256[] memory referencedTopicIds,
        string[] memory combinedOptions,
        uint256 minBetAmount,
        uint256 totalPool,
        TopicStatus status,
        uint256 winningOption
    ) {
        CompositeTopic storage topic = compositeTopics[topicId];
        require(topic.id != 0, "Composite topic does not exist");
        
        return (
            topic.id,
            topic.creator,
            topic.title,
            topic.referencedTopicIds,
            topic.combinedOptions,
            topic.minBetAmount,
            topic.totalPool,
            topic.status,
            topic.winningOption
        );
    }

    /**
     * @dev 获取某选项的投注总额
     */
    function getOptionBetTotal(uint256 topicId, uint256 optionIndex) 
        external view returns (uint256) {
        return optionTotalBets[topicId][optionIndex];
    }

    /**
     * @dev 获取用户在某选项的投注额
     */
    function getUserBetAmount(uint256 topicId, address user, uint256 optionIndex) 
        external view returns (uint256) {
        return userBets[topicId][user][optionIndex];
    }

    /**
     * @dev 获取组合议题的所有投注
     */
    function getCompositeBets(uint256 topicId) external view returns (CompositeBet[] memory) {
        return compositeBets[topicId];
    }

    // 保持原有的查询函数...
    function getTopicsCount() external view returns (uint256) {
        return topicIds.length;
    }

    function getTopic(uint256 topicId) external view returns (
        uint256 id,
        address creator,
        string memory title,
        string[] memory options,
        uint256 betAmount,
        address[2] memory players,
        uint256[2] memory playerChoices,
        uint256 totalPool,
        TopicStatus status,
        uint256 winningOption,
        address winner
    ) {
        Topic storage topic = topics[topicId];
        require(topic.id != 0, "Topic does not exist");
        
        return (
            topic.id,
            topic.creator,
            topic.title,
            topic.options,
            topic.betAmount,
            topic.players,
            topic.playerChoices,
            topic.totalPool,
            topic.status,
            topic.winningOption,
            topic.winner
        );
    }

    function getAllTopicIds() external view returns (uint256[] memory) {
        return topicIds;
    }

    function getAllCompositeTopicIds() external view returns (uint256[] memory) {
        return compositeTopicIds;
    }

    receive() external payable {}
}
