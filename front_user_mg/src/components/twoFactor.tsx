import Input from './input'
import useForm from './useFormInput';
import EmailField from './EmailField';
import { Link } from 'react-router-dom';
import { useAuth } from './authContext';
import signInApi from '../api/signinApi';
import Oauth2 from '../api/Oauth2';
import PasswordField from './PasswordField';
import { useNavigate } from 'react-router-dom';
import GoogleIcon from '../assets/googleIcon.png';
import PingoHappy from '../assets/pingo_happy.svg';
import { useApiSubmission } from '../hooks/useApiSubmission';
import validateEmail, { validatePassword } from '../utils/FormValidation'
import { useToast } from './toastContext';
import Cookies from "js-cookie";


function TwoFactor() {
	const {showToast} = useToast() as any;
	const email = useForm('', validateEmail);
	const password = useForm('', validatePassword);
	const { login } = useAuth() as any;
	const navigate = useNavigate();
	const { isLoading, isSuccess, submissionError, submit } = useApiSubmission();


	const handleSubmit = async (e) => {
		e.preventDefault();

		const mailerror = validateEmail(email.value)
		const passworderror = validatePassword(password.value)

		email.setError(mailerror);
		password.setError(passworderror);

		if (mailerror || passworderror) {
			return ;
		}
		const apiCall = () => signInApi(email.value.trim(), password.value);

		try {
			const response = await submit(apiCall);
			showToast(`${response.message}`, response.success ? 'success' : 'failure');
			if (response.success)
			{
				login(response.jwt);
				Cookies.set("jwt", response.jwt, {
					expires: 7,
					secure: true,
					sameSite: "Strict"
				});
				navigate('/dashboard');
			}
		} catch (error) {
			console.error("Submission failed, error shown to user.");
		}
	};

	return (
		<>
			<img className="w-12" src={PingoHappy}></img>
			<div className="m-3">
				<p className="font-bebas-neue text-h4">Pongfinity</p>
				<p className="text-h5 font-bebas-neue">Enter the code sent to your email.</p>
			</div>
			{submissionError && (<span className={isSuccess ? 'submission-success' : 'submission-error'}> {submissionError} </span>)}
			<form onSubmit={handleSubmit} className="flex flex-col gap-2 w-4/5">
				<div className={`flex flex-col gap-0 rounded-lg ${email.error ? "bg-red/15" : ""}`}>
				<PasswordField
					className="flex-[1.8] sm:min-w-[150px]"
					onChange={password.onChange}
					onBlur={password.onBlur}
					value={password.value}
					error={password.error}
					placeHolder='Enter 6-digit code'
				/>
				{password.error && <span className='error-span bg-red/15 -mt-[10px] rounded-b-lg' > {password.error}</span>}
				</div>
				<div className="flex flex-row flex-wrap gap-2">
				<Input
					className="flex-[1.2] sm:min-w-[90px]"
					type="submit"
					name="submit"
					value="verify"
					error={email.error != password.error}
					isLoading={isLoading}
				/>
				</div>
				<div>
					<p className="font-bebas-neue text-h5">have a good day
						<br/>
						<br/>
					</p>
				</div>
			</form>
		</>
	);
}

export default TwoFactor;