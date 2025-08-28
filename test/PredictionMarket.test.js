import { expect } from "chai";
import { ethers } from "hardhat";

describe("PredictionMarket", function () {
    let mockUSDC;
    let predictionMarket;
    let owner;
    let player1;
    let player2;
    let player3;

    const INITIAL_USDC_AMOUNT = ethers.parseUnits("10000", 6); // 10,000 USDC
    const BET_AMOUNT = ethers.parseUnits("100", 6); // 100 USDC

    beforeEach(async function () {
        // 获取测试账户
        [owner, player1, player2, player3] = await ethers.getSigners();

        // 部署 MockUSDC
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        mockUSDC = await MockUSDC.deploy();
        await mockUSDC.waitForDeployment();

        // 部署 PredictionMarket
        const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
        predictionMarket = await PredictionMarket.deploy(await mockUSDC.getAddress());
        await predictionMarket.waitForDeployment();

        // 给测试账户mint USDC
        await mockUSDC.mintUSDC(player1.address, 10000);
        await mockUSDC.mintUSDC(player2.address, 10000);
        await mockUSDC.mintUSDC(player3.address, 10000);

        // 授权合约使用USDC
        await mockUSDC.connect(player1).approve(await predictionMarket.getAddress(), INITIAL_USDC_AMOUNT);
        await mockUSDC.connect(player2).approve(await predictionMarket.getAddress(), INITIAL_USDC_AMOUNT);
        await mockUSDC.connect(player3).approve(await predictionMarket.getAddress(), INITIAL_USDC_AMOUNT);
    });

    describe("部署", function () {
        it("应该正确设置USDC地址", async function () {
            expect(await predictionMarket.usdcToken()).to.equal(await mockUSDC.getAddress());
        });

        it("应该初始化nextTopicId为1", async function () {
            expect(await predictionMarket.nextTopicId()).to.equal(1);
        });
    });

    describe("创建议题", function () {
        it("应该能够创建新议题", async function () {
            const title = "第一个走进门的是男生还是女生";
            const options = ["男生", "女生"];
            const choice = 0; // 选择男生

            await expect(
                predictionMarket.connect(player1).createTopic(title, options, BET_AMOUNT, choice)
            ).to.emit(predictionMarket, "TopicCreated")
             .withArgs(1, player1.address, title, BET_AMOUNT);

            // 检查议题详情
            const topic = await predictionMarket.getTopic(1);
            expect(topic.id).to.equal(1);
            expect(topic.creator).to.equal(player1.address);
            expect(topic.title).to.equal(title);
            expect(topic.options[0]).to.equal("男生");
            expect(topic.options[1]).to.equal("女生");
            expect(topic.betAmount).to.equal(BET_AMOUNT);
            expect(topic.players[0]).to.equal(player1.address);
            expect(topic.playerChoices[0]).to.equal(0);
            expect(topic.totalPool).to.equal(BET_AMOUNT);
            expect(topic.status).to.equal(0); // WAITING_FOR_SECOND_PLAYER
        });

        it("应该拒绝少于2个选项的议题", async function () {
            await expect(
                predictionMarket.connect(player1).createTopic("测试", ["选项1"], BET_AMOUNT, 0)
            ).to.be.revertedWith("At least 2 options required");
        });

        it("应该拒绝无效的选择", async function () {
            await expect(
                predictionMarket.connect(player1).createTopic("测试", ["选项1", "选项2"], BET_AMOUNT, 2)
            ).to.be.revertedWith("Invalid choice");
        });

        it("应该拒绝零投注金额", async function () {
            await expect(
                predictionMarket.connect(player1).createTopic("测试", ["选项1", "选项2"], 0, 0)
            ).to.be.revertedWith("Bet amount must be greater than 0");
        });
    });

    describe("加入议题", function () {
        beforeEach(async function () {
            // 创建一个议题
            await predictionMarket.connect(player1).createTopic(
                "测试议题",
                ["选项1", "选项2"],
                BET_AMOUNT,
                0
            );
        });

        it("应该能够加入议题", async function () {
            await expect(
                predictionMarket.connect(player2).joinTopic(1, 1)
            ).to.emit(predictionMarket, "PlayerJoined")
             .withArgs(1, player2.address, 1);

            // 检查议题状态
            const topic = await predictionMarket.getTopic(1);
            expect(topic.players[1]).to.equal(player2.address);
            expect(topic.playerChoices[1]).to.equal(1);
            expect(topic.totalPool).to.equal(BET_AMOUNT * 2n);
            expect(topic.status).to.equal(1); // ACTIVE
        });

        it("应该拒绝创建者加入自己的议题", async function () {
            await expect(
                predictionMarket.connect(player1).joinTopic(1, 1)
            ).to.be.revertedWith("Creator cannot join own topic");
        });

        it("应该拒绝加入不存在的议题", async function () {
            await expect(
                predictionMarket.connect(player2).joinTopic(999, 0)
            ).to.be.revertedWith("Topic does not exist");
        });

        it("应该拒绝无效的选择", async function () {
            await expect(
                predictionMarket.connect(player2).joinTopic(1, 2)
            ).to.be.revertedWith("Invalid choice");
        });
    });

    describe("裁定议题", function () {
        beforeEach(async function () {
            // 创建议题并让第二个玩家加入
            await predictionMarket.connect(player1).createTopic(
                "测试议题",
                ["选项1", "选项2"],
                BET_AMOUNT,
                0
            );
            await predictionMarket.connect(player2).joinTopic(1, 1);
        });

        it("应该能够裁定议题", async function () {
            await expect(
                predictionMarket.connect(player1).resolveTopic(1, 1)
            ).to.emit(predictionMarket, "TopicResolved")
             .withArgs(1, 1, player2.address);

            // 检查议题状态
            const topic = await predictionMarket.getTopic(1);
            expect(topic.status).to.equal(2); // RESOLVED
            expect(topic.winningOption).to.equal(1);
            expect(topic.winner).to.equal(player2.address);
        });

        it("应该拒绝非创建者裁定", async function () {
            await expect(
                predictionMarket.connect(player2).resolveTopic(1, 1)
            ).to.be.revertedWith("Only creator can resolve");
        });

        it("应该拒绝裁定不活跃的议题", async function () {
            // 先裁定一次
            await predictionMarket.connect(player1).resolveTopic(1, 1);
            
            // 再次尝试裁定
            await expect(
                predictionMarket.connect(player1).resolveTopic(1, 0)
            ).to.be.revertedWith("Topic not active");
        });

        it("应该拒绝无效的获胜选项", async function () {
            await expect(
                predictionMarket.connect(player1).resolveTopic(1, 2)
            ).to.be.revertedWith("Invalid winning option");
        });
    });

    describe("领取奖金", function () {
        beforeEach(async function () {
            // 创建议题、加入并裁定
            await predictionMarket.connect(player1).createTopic(
                "测试议题",
                ["选项1", "选项2"],
                BET_AMOUNT,
                0
            );
            await predictionMarket.connect(player2).joinTopic(1, 1);
            await predictionMarket.connect(player1).resolveTopic(1, 1); // player2获胜
        });

        it("应该能够领取奖金", async function () {
            const balanceBefore = await mockUSDC.balanceOf(player2.address);
            
            await expect(
                predictionMarket.connect(player2).claimReward(1)
            ).to.emit(predictionMarket, "RewardClaimed")
             .withArgs(1, player2.address, BET_AMOUNT * 2n);

            const balanceAfter = await mockUSDC.balanceOf(player2.address);
            expect(balanceAfter - balanceBefore).to.equal(BET_AMOUNT * 2n);

            // 检查议题状态
            const topic = await predictionMarket.getTopic(1);
            expect(topic.status).to.equal(3); // CLAIMED
        });

        it("应该拒绝非获胜者领取奖金", async function () {
            await expect(
                predictionMarket.connect(player1).claimReward(1)
            ).to.be.revertedWith("Only winner can claim");
        });

        it("应该拒绝领取未裁定议题的奖金", async function () {
            // 创建新议题但不裁定
            await predictionMarket.connect(player1).createTopic(
                "新议题",
                ["选项1", "选项2"],
                BET_AMOUNT,
                0
            );
            await predictionMarket.connect(player2).joinTopic(2, 1);

            await expect(
                predictionMarket.connect(player2).claimReward(2)
            ).to.be.revertedWith("Topic not resolved");
        });
    });

    describe("查询功能", function () {
        beforeEach(async function () {
            // 创建多个议题
            await predictionMarket.connect(player1).createTopic(
                "议题1",
                ["选项1", "选项2"],
                BET_AMOUNT,
                0
            );
            await predictionMarket.connect(player2).createTopic(
                "议题2",
                ["选项A", "选项B", "选项C"],
                BET_AMOUNT,
                1
            );
        });

        it("应该返回正确的议题数量", async function () {
            expect(await predictionMarket.getTopicsCount()).to.equal(2);
        });

        it("应该返回所有议题ID", async function () {
            const topicIds = await predictionMarket.getAllTopicIds();
            expect(topicIds.length).to.equal(2);
            expect(topicIds[0]).to.equal(1);
            expect(topicIds[1]).to.equal(2);
        });

        it("应该返回用户创建的议题", async function () {
            const player1Topics = await predictionMarket.getUserCreatedTopics(player1.address);
            const player2Topics = await predictionMarket.getUserCreatedTopics(player2.address);

            expect(player1Topics.length).to.equal(1);
            expect(player1Topics[0]).to.equal(1);
            expect(player2Topics.length).to.equal(1);
            expect(player2Topics[0]).to.equal(2);
        });
    });
});
