// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PredictionMarketETH is ReentrancyGuard {

    enum TopicStatus {
        WAITING_FOR_SECOND_PLAYER,  // 等待第二个玩家
        ACTIVE,                     // 活跃状态（两个玩家都已加入）
        RESOLVED,                   // 已裁定结果
        CLAIMED                     // 奖金已领取
    }

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
    }

    // 状态变量
    uint256 public nextTopicId;
    mapping(uint256 => Topic) public topics;
    uint256[] public topicIds;

    // 事件
    event TopicCreated(uint256 indexed topicId, address indexed creator, string title, uint256 betAmount);
    event PlayerJoined(uint256 indexed topicId, address indexed player, uint256 choice);
    event TopicResolved(uint256 indexed topicId, uint256 winningOption, address winner);
    event RewardClaimed(uint256 indexed topicId, address indexed winner, uint256 amount);

    constructor() {
        nextTopicId = 1;
    }

    /**
     * @dev 创建新议题
     * @param title 议题标题
     * @param options 选项数组
     * @param choice 创建者选择的选项索引
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

        // 创建议题
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

        topicIds.push(topicId);

        emit TopicCreated(topicId, msg.sender, title, msg.value);
    }

    /**
     * @dev 加入议题
     * @param topicId 议题ID
     * @param choice 选择的选项索引
     */
    function joinTopic(uint256 topicId, uint256 choice) external payable nonReentrant {
        Topic storage topic = topics[topicId];
        
        require(topic.id != 0, "Topic does not exist");
        require(topic.status == TopicStatus.WAITING_FOR_SECOND_PLAYER, "Topic not available for joining");
        require(msg.sender != topic.creator, "Creator cannot join own topic");
        require(choice < topic.options.length, "Invalid choice");
        require(msg.value == topic.betAmount, "Incorrect bet amount");

        // 添加第二个玩家
        topic.players[1] = msg.sender;
        topic.playerChoices[1] = choice;
        topic.status = TopicStatus.ACTIVE;
        topic.totalPool += msg.value;

        emit PlayerJoined(topicId, msg.sender, choice);
    }

    /**
     * @dev 裁定议题结果（只有创建者可以调用）
     * @param topicId 议题ID
     * @param winningOption 获胜选项的索引
     */
    function resolveTopic(uint256 topicId, uint256 winningOption) external {
        Topic storage topic = topics[topicId];
        
        require(topic.id != 0, "Topic does not exist");
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
     * @dev 领取奖金
     * @param topicId 议题ID
     */
    function claimReward(uint256 topicId) external nonReentrant {
        Topic storage topic = topics[topicId];
        
        require(topic.id != 0, "Topic does not exist");
        require(topic.status == TopicStatus.RESOLVED, "Topic not resolved");
        require(msg.sender == topic.winner, "Only winner can claim");

        topic.status = TopicStatus.CLAIMED;

        // 转账给获胜者
        uint256 reward = topic.totalPool;
        (bool success, ) = payable(topic.winner).call{value: reward}("");
        require(success, "Transfer failed");

        emit RewardClaimed(topicId, topic.winner, reward);
    }

    /**
     * @dev 获取所有议题数量
     */
    function getTopicsCount() external view returns (uint256) {
        return topicIds.length;
    }

    /**
     * @dev 获取议题详情
     * @param topicId 议题ID
     */
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

    /**
     * @dev 获取所有议题ID
     */
    function getAllTopicIds() external view returns (uint256[] memory) {
        return topicIds;
    }

    /**
     * @dev 获取用户创建的议题
     * @param user 用户地址
     */
    function getUserCreatedTopics(address user) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < topicIds.length; i++) {
            if (topics[topicIds[i]].creator == user) {
                count++;
            }
        }
        
        uint256[] memory userTopics = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < topicIds.length; i++) {
            if (topics[topicIds[i]].creator == user) {
                userTopics[index] = topicIds[i];
                index++;
            }
        }
        
        return userTopics;
    }

    /**
     * @dev 获取用户参与的议题
     * @param user 用户地址
     */
    function getUserJoinedTopics(address user) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < topicIds.length; i++) {
            Topic storage topic = topics[topicIds[i]];
            if ((topic.players[0] == user || topic.players[1] == user) && topic.creator != user) {
                count++;
            }
        }
        
        uint256[] memory userTopics = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < topicIds.length; i++) {
            Topic storage topic = topics[topicIds[i]];
            if ((topic.players[0] == user || topic.players[1] == user) && topic.creator != user) {
                userTopics[index] = topicIds[i];
                index++;
            }
        }
        
        return userTopics;
    }

    /**
     * @dev 允许合约接收ETH
     */
    receive() external payable {}
}
