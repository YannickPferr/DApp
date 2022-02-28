import { useEffect, useState } from 'react';
import Web3 from 'web3';
import { Button, Container, Row, Col, Form, Alert } from 'react-bootstrap';
import ContractABI from './resources/Test.json'

function App() {
	const [errorMessage, showError] = useState();
	const [infoMessage, showInfo] = useState();
	const [successMessage, showSuccess] = useState();
	const [account, setAccount] = useState();
	const [tvl, setTVL] = useState(0);
	const [balance, setBalance] = useState(0);
	const web3 = new Web3(Web3.givenProvider || "http://localhost:7545");
	const contract = new web3.eth.Contract(ContractABI, "0x9970C09DEa4f0701CfF79a2B806c783980B97614");

	if(window.ethereum){
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
	else if(!infoMessage)
		showInfo("Please install Metamask first!");

	useEffect(() => {
		refreshContractState();
	});

	async function connectWallet() {
		const accounts = await web3.eth.requestAccounts();
		if(accounts)
			setAccount(accounts[0]);
		else
			showInfo("Please install Metamask first!")
	}

	function refreshContractState() {
		getTVL();
		getBalance();
	}

	function resetMessages(){
		showError();
		showInfo();
		showSuccess();
	}

	async function getTVL() {
		let tvl = await contract.methods.getTVL().call();
		setTVL(web3.utils.fromWei(tvl));
	}

	async function getBalance() {
		let balance = await contract.methods.getBalance().call({ from: account });
		setBalance(web3.utils.fromWei(balance));
	}

	async function withdraw() {
		resetMessages();
		let btn = document.getElementById("withdrawBtn");
		btn.disabled = true;
		let amount = document.getElementById("withdraw").value;
		contract.methods.withdraw(web3.utils.toWei(amount))
			.send({ from: account })
			.on('transactionHash', function (txhash) {
				btn.innerText = "Pending...";
				showInfo("Transaction " + txhash + " submitted");
			})
			.on('receipt', function (receipt) {
				btn.disabled = false;
				btn.innerText = "Withdraw";
				if(receipt.status)
					showSuccess("Transaction " + receipt.transactionHash + " confirmed");
			})
			.on('error', function (error, receipt) {
				btn.disabled = false;
				btn.innerText = "Withdraw";
				showError("Transaction failed!");
				console.log(error);
			});
	}

	async function deposit() {
		resetMessages();
		let btn = document.getElementById("depositBtn");
		btn.disabled = true;
		let amount = document.getElementById("deposit").value;
		contract.methods.deposit()
			.send({ from: account, value: web3.utils.toWei(amount) })
			.on('transactionHash', function (txhash) {
				btn.innerText = "Pending...";
				showInfo("Transaction " + txhash + " submitted");
			})
			.on('receipt', function (receipt) {
				btn.disabled = false;
				btn.innerText = "Deposit";
				if(receipt.status)
					showSuccess("Transaction " + receipt.transactionHash + " confirmed");
			})
			.on('error', function (error, receipt) {
				btn.disabled = false;
				btn.innerText = "Deposit";
				showError("Transaction failed!");
				console.log(error);
			});
	}

	return (
		<Container className='p-2'>
			{errorMessage && <Alert variant="danger" onClose={() => showError()} dismissible>{errorMessage}</Alert>}
			{infoMessage && <Alert variant="primary" onClose={() => showInfo()} dismissible>{infoMessage}</Alert>}
			{successMessage && <Alert variant="success" onClose={() => showSuccess()} dismissible>{successMessage}</Alert>}
			<Row className='mb-2'>
				<Button onClick={() => connectWallet()}>{account ? account : "Connect Wallet"}</Button>
			</Row>
			<Row className='mb-2'>
				<Col>Total Value Locked:</Col>
				<Col md={10}><strong>{tvl} Ether</strong></Col>
			</Row>
			<Row className='mb-2'>
				<Col>My Deposit:</Col>
				<Col md={10}><strong>{balance} Ether</strong></Col>
			</Row>
			<Row className='mb-2'>
				<Col>Amount:</Col>
				<Col md={8}><Form.Control id="withdraw" type="text" placeholder="Amount to withdraw" /></Col>
				<Col className='d-grid'><Button id="withdrawBtn" onClick={() => withdraw()}>Withdraw</Button>
				</Col>
			</Row>
			<Row className='mb-2'>
				<Col>Amount:</Col>
				<Col md={8}><Form.Control id="deposit" type="text" placeholder="Amount to deposit" /></Col>
				<Col className='d-grid'><Button id="depositBtn" onClick={() => deposit()}>Deposit</Button></Col>
			</Row>
		</Container>
	);
}

export default App;