import { useEffect, useState } from 'react';
import Web3 from 'web3';
import { Button, Container, Row, Col, Form, Alert } from 'react-bootstrap';
import YannickPferrCoin from './resources/YannickPferrCoin.json'
import YPCSwap from './resources/YPCSwap.json'
import { ArrowDownUp } from 'react-bootstrap-icons';

function App() {
	const [errorMessage, showError] = useState();
	const [infoMessage, showInfo] = useState();
	const [successMessage, showSuccess] = useState();
	const [account, setAccount] = useState();
	const [ethLiquidity, setEthLiquidity] = useState(0);
	const [ypcLiquidity, setYpcLiquidity] = useState(0);
	const [YPCBalance, setYPCBalance] = useState(0);

	const [from, setFrom] = useState("ETH");
	const [to, setTo] = useState("YPC");

	const web3 = new Web3(Web3.givenProvider || "http://localhost:7545");
	const ypc = new web3.eth.Contract(YPCSwap, "0x57aDbACf1Db217b003F2f1d2fec93bCc837e7D24");

	const exchangeRate = 1000000;

	if (window.ethereum) {
		web3.eth.getAccounts().then(accounts => {
			if (accounts[0])
				setAccount(accounts[0]);
			else
				console.log("No existing connection");
		});

		window.ethereum.on('accountsChanged', function (accounts) {
			setAccount(accounts[0]);
		});
	}
	else if (!infoMessage)
		showInfo("Please install Metamask first!");

	useEffect(() => {
		if (account)
			refreshContractState();
	});

	async function connectWallet() {
		const accounts = await web3.eth.requestAccounts();
		if (accounts)
			setAccount(accounts[0]);
		else
			showInfo("Please install Metamask first!")

		addToken();
	}

	async function addToken() {
		let tokenAddress = await ypc.methods.getTokenAddress().call();
		const tokenSymbol = 'YPC';
		const tokenDecimals = 18;
		const tokenImage = "https://www.pferr.de/static/3e47b5ffa1c3d7517a07a6858c56c14b/463d2/profilePic.jpg";

		try {
			await window.ethereum.request({
				method: 'wallet_watchAsset',
				params: {
					type: 'ERC20', // Initially only supports ERC20, but eventually more!
					options: {
						address: tokenAddress, // The address that the token is at.
						symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
						decimals: tokenDecimals, // The number of decimals in the token
						image: tokenImage// A string url of the token logo
					},
				},
			});
		} catch (error) {
			console.log(error);
		}
	}

	function refreshContractState() {
		getEthLiquidity();
		getYpcLiquidity();
		getYPCBalance();
	}

	function resetMessages() {
		showError();
		showInfo();
		showSuccess();
	}

	async function getEthLiquidity() {
		let ethLiquidity = await ypc.methods.getEthLiquidity().call();
		setEthLiquidity(web3.utils.fromWei(ethLiquidity));
	}

	async function getYpcLiquidity() {
		let ypcLiquidity = await ypc.methods.getYPCLiquidity().call();
		setYpcLiquidity(ypcLiquidity / 1e18);
	}

	async function getYPCBalance() {
		let balance = await ypc.methods.balanceOf(account).call();
		setYPCBalance(balance / 1e18);
	}

	function switchCoins() {
		//switch labels
		let temp = from;
		setFrom(to);
		setTo(temp);

		//switch inputs
		let old = document.getElementById("from").value;
		document.getElementById("from").value = document.getElementById("to").value;
		document.getElementById("to").value = old;
	}

	function swap() {
		resetMessages();
		let btn = document.getElementById("swapBtn");
		btn.disabled = true;
		let fromValue = document.getElementById("from").value;
		if (from === "ETH") {
			ypc.methods.ethToYpc()
				.send({ from: account, value: web3.utils.toWei(fromValue) })
				.on('transactionHash', function (txhash) {
					btn.innerText = "Pending...";
					showInfo("Transaction " + txhash + " submitted");
				})
				.on('receipt', function (receipt) {
					btn.disabled = false;
					btn.innerText = "Swap";
					if (receipt.status)
						showSuccess("Transaction " + receipt.transactionHash + " confirmed");
				})
				.on('error', function (error, receipt) {
					btn.disabled = false;
					btn.innerText = "Swap";
					showError("Transaction failed!");
					console.log(error);
				});
		} else if (from === "YPC") {
			ypc.methods.getTokenAddress().call().then(tokenAddress => {
				console.log(ypc._address)
				const contract = new web3.eth.Contract(YannickPferrCoin, tokenAddress);
				contract.methods.approve(ypc._address, (fromValue * 1e18).toString())
					.send({ from: account })
					.on('receipt', function (receipt) {
						ypc.methods.ypcToEth((fromValue * 1e18).toString())
							.send({ from: account })
							.on('transactionHash', function (txhash) {
								btn.innerText = "Pending...";
								showInfo("Transaction " + txhash + " submitted");
							})
							.on('receipt', function (receipt) {
								btn.disabled = false;
								btn.innerText = "Swap";
								if (receipt.status)
									showSuccess("Transaction " + receipt.transactionHash + " confirmed");
							})
							.on('error', function (error, receipt) {
								btn.disabled = false;
								btn.innerText = "Swap";
								showError("Transaction failed!");
								console.log(error);
							});
					})
					.on('error', function (error, receipt) {
						btn.disabled = false;
						showError("Transaction failed!");
						console.log(error);
					});

			});
		}

	}

	function calcTo() {
		let fromValue = document.getElementById("from").value;
		if (from === "ETH") {
			fromValue *= exchangeRate;
		} else if (from === "YPC") {
			fromValue /= exchangeRate;
		}
		document.getElementById("to").value = fromValue;
	}

	return (
		<Container className='p-2'>
			{errorMessage && <Alert variant="danger" onClose={() => showError()} dismissible>{errorMessage}</Alert>}
			{infoMessage && <Alert variant="primary" onClose={() => showInfo()} dismissible>{infoMessage}</Alert>}
			{successMessage && <Alert variant="success" onClose={() => showSuccess()} dismissible>{successMessage}</Alert>}
			<Row className='mb-2'>
				<Button onClick={() => connectWallet()}>{account ? "Wallet address: " + account : "Connect MetaMask"}</Button>
			</Row>
			<Row className='mb-2'>
				<Button onClick={() => addToken()}>Add token to MetaMask</Button>
			</Row>
			<Row className='mb-2'>
				<Col></Col>
				<Col>Contract ETH Liquidity:</Col>
				<Col md={8}><strong>{ethLiquidity} Ether</strong></Col>
			</Row>
			<Row className='mb-2'>
				<Col></Col>
				<Col>Contract YPC Liquidity:</Col>
				<Col md={8}><strong>{ypcLiquidity} YPC</strong></Col>
			</Row>
			<Row className='mb-2'>
				<Col></Col>
				<Col>My YPC Balance:</Col>
				<Col md={8}><strong>{YPCBalance} YPC</strong></Col>
			</Row>

			<Row className='mb-2'>
				<Col></Col>
				<Col md={8}><Form.Control id="from" type="text" placeholder="From" onChange={calcTo} /></Col>
				<Col>{from}</Col>
			</Row>
			<Row className='mb-2'>
				<Col className='d-grid'></Col>
				<Col md={2} className='d-grid'><Button id="switchCoinsBtn" className='btn-circle d-flex justify-content-center align-items-center' onClick={() => switchCoins()}><ArrowDownUp /></Button></Col>
				<Col className='d-grid'></Col>
			</Row>
			<Row className='mb-2'>
				<Col className='d-grid'></Col>
				<Col md={8}><Form.Control id="to" type="text" disabled placeholder="To" /></Col>
				<Col>{to}</Col>
			</Row>
			<Row className='mb-2'>
				<Col className='d-grid'></Col>
				<Col md={2} className='d-grid'><Button id="swapBtn" onClick={() => swap()}>Swap</Button></Col>
				<Col className='d-grid'></Col>
			</Row>
		</Container>
	);
}

export default App;