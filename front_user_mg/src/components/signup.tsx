import { Link } from 'react-router-dom';
import { useState } from 'react';
import useForm from './useFormInput';
import UsernameField from './UsernameField';
import EmailField from './EmailField';
import signUpApi from '../api/signupApi';
import PasswordField from './PasswordField';
import validateEmail from '../utils/FormValidation';
import { validateUsername } from '../utils/FormValidation';
import { validatePassword } from '../utils/FormValidation';
import Input from './input';
import { useApiSubmission } from '../hooks/useApiSubmission';
import { useNavigate } from 'react-router-dom';
import { useToast } from './toastContext';
import PingoHappy from '../assets/pingo_happy.svg';
import GoogleIcon from '../assets/googleIcon.png';


function Signup() {
  const email = useForm('', validateEmail);
	const username = useForm('', validateUsername);
	const password = useForm('', validatePassword);
  const [passError, setpassError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
	const navigate = useNavigate();
  const { showToast } = useToast() as any;
	const { isLoading, isSuccess, submissionError, submit } = useApiSubmission();
  

  const checkpasswords = (e) => {
    if (e.target.value == password.value)
      setpassError('');
    else
      setpassError('Must match the new password above');
  }

	const handleSubmit = async (e) => {
		e.preventDefault();

		const mailerror = validateEmail(email.value)
		const passworderror = validatePassword(password.value)
    const usernameerror = validateUsername(username.value);
    const confirmpasserror = !confirmPassword ? 'Must match the new password above' : '';

		email.setError(mailerror);
		password.setError(passworderror);
		username.setError(usernameerror);
    setpassError(confirmpasserror);

		if (mailerror || passworderror || usernameerror || confirmpasserror) {
			return ;
		}
		const apiCall = () => signUpApi(username.value, email.value.trim(), password.value);

		try {
			const response = await submit(apiCall);
      console.log(response.message);
			showToast(`${response.message}`, response.success ? 'success' : 'failure');
      response.success && navigate('/signin');
		} catch (error) {
			console.error("Submission failed, error shown to user.");
		}
	};

  return (
    <>
      <img className="w-12" src={PingoHappy}></img>
      <div className="mb-3">
        <p className="font-bebas-neue text-h4">Create Your Account</p>
        <p className="text-h5body">Join to play and track your progress.</p>
      </div>
      {submissionError && (<span className={isSuccess ? 'submission-success' : 'submission-error'}> {submissionError} </span>)}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-4/5">
        <div className={`flex flex-col gap-0 rounded-lg ${username.error ? "bg-red/15" : ""}`}>
          <UsernameField
            onChange={username.onChange}
            onBlur={username.onBlur}
            value={username.value}
            error={username.error}
            />
          {username.error && <span className='error-span' > {username.error}</span>}
        </div>
        <div className={`flex flex-col gap-0 rounded-lg ${email.error ? "bg-red/15" : ""}`}>
          <EmailField
            onChange={email.onChange}
            onBlur={email.onBlur}
            value={email.value}
            error={email.error}
            />
          {email.error && <span className='error-span max-w-[300px]' > {email.error}</span>}
        </div>
        <div className={`flex flex-col gap-0 rounded-lg ${password.error ? "bg-red/15" : ""}`}>
				  <PasswordField
				  	onChange={password.onChange}
				  	onBlur={password.onBlur}
				  	value={password.value}
				  	error={password.error}
            />
          {password.error && <span className='error-span' > {password.error}</span>}
        </div>
        <div className={`flex flex-col gap-0 rounded-lg ${passError ? "bg-red/15" : ""}`}>
				  <PasswordField
            placeHolder='Re-enter Password'
				  	onBlur={checkpasswords}
            onChange={(e) => {setConfirmPassword(e.target.value)}}
            value={confirmPassword}
            error={passError}
          />
          {passError && <span className='error-span' >{passError}</span>}
        </div>
		<Input
			className="flex-[1.2] sm:min-w-[90px]"
		  type="submit"
		  name="submit"
		  value="create account"
      error={(username.error != email.error) || (password.error != passError)}
      isLoading={isLoading}
		/>
		<div className="flex flex-row items-center justify-evenly">
			<hr className="w-1/3 border-bgsecondary" />
      <p className="text-h6body font-bebas-neue">or</p>
			<hr className="w-1/3 border-bgsecondary" />
      </div>
      <Link to='http://localhost:3000/login/google' className="inline-flex items-center gap-0 secondary-button">
      <p className='leading-none w-full font-bebas-neue'>sign up with Google</p>
      <img className="w-4" src={GoogleIcon} />
      </Link>
        <div className="flex flex-row flex-wrap mb-5 justify-evenly font-bebas-neue">
          <Link to="/signin" className="w-full secondary-button">
          sign in
          </Link>
        </div>
      </form>
    </>
  )
}

export default Signup
