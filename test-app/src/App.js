import { useEffect, useState } from 'react';
import Web3 from 'web3';
import { Button, Container, Row, Col, Form, Alert, Spinner } from 'react-bootstrap';
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
		console.log("Connect");
		const accounts = await web3.eth.requestAccounts();
		if(accounts)
			setAccount(accounts[0]);
		else
			showInfo("Please install Metamask first!")
	}

	async function getTVL() {
		let tvl = await contract.methods.getTVL().call();
		setTVL(web3.utils.fromWei(tvl));
	}

	async function getBalance() {
		let balance = await contract.methods.getBalance().call({ from: account });
		setBalance(web3.utils.fromWei(balance));
	}

	function refreshContractState() {
		getTVL();
		getBalance();
	}

	async function withdraw() {
		document.getElementById("withdrawBtn").disabled = true;
		let amount = document.getElementById("withdraw").value;
		contract.methods.withdraw(web3.utils.toWei(amount))
			.send({ from: account })
			.on('transactionHash', function (txhash) {
				document.getElementById("spinner").hidden = false;
				showInfo("Transaction " + txhash + " submitted");
			})
			.on('confirmation', function (confirmationNumber, receipt) {
				document.getElementById("withdrawBtn").disabled = false;
				document.getElementById("spinner").hidden = true;
				showSuccess("Transaction " + receipt.transactionHash + " confirmed");
			})
			.on('error', function (error, receipt) {
				document.getElementById("withdrawBtn").disabled = false;
				document.getElementById("spinner").hidden = true;
				showError("Transaction failed!");
				console.log(error);
			});
	}

	async function deposit() {
		document.getElementById("depositBtn").disabled = true;
		let amount = document.getElementById("deposit").value;
		contract.methods.deposit()
			.send({ from: account, value: web3.utils.toWei(amount) })
			.on('transactionHash', function (txhash) {
				document.getElementById("spinner").hidden = false;
				showInfo("Transaction " + txhash + " submitted");
			})
			.on('confirmation', function (confirmationNumber, receipt) {
				document.getElementById("depositBtn").disabled = false;
				document.getElementById("spinner").hidden = true;
				showSuccess("Transaction " + receipt.transactionHash + " confirmed");
			})
			.on('error', function (error, receipt) {
				document.getElementById("depositBtn").disabled = false;
				document.getElementById("spinner").hidden = true;
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
				<Col>{tvl}</Col>
			</Row>
			<Row className='mb-2'>
				<Col>My Deposit:</Col>
				<Col>{balance}</Col>
			</Row>
			<Row className='mb-2'>
				<Col>Amount:</Col>
				<Col><Form.Control id="withdraw" type="text" placeholder="Amount to withdraw" /></Col>
				<Col><Button id="withdrawBtn" onClick={() => withdraw()}>Withdraw</Button></Col>
			</Row>
			<Row className='mb-2'>
				<Col>Amount:</Col>
				<Col><Form.Control id="deposit" type="text" placeholder="Amount to deposit" /></Col>
				<Col><Button id="depositBtn" onClick={() => deposit()}>Deposit</Button></Col>
			</Row>
			<Row className='mb-2' className="mb-2 justify-content-center">
				<Spinner id="spinner" animation="border" hidden/>
			</Row>
		</Container>
	);
}

export default App;