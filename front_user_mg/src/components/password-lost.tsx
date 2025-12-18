import { Link } from 'react-router-dom';
import PingoSad from '../assets/pingo_sad.png';
import EmailField from './EmailField';
import validateEmail from '../utils/FormValidation';
import useForm from './useFormInput';
import Input from './input';
import ForgotPassword from '../api/forgotPasswordApi';
import { useApiSubmission } from '../hooks/useApiSubmission';

function PasswordLost() {
  const email = useForm('', validateEmail);
	const { isLoading, isSuccess, submissionError, submit } = useApiSubmission();

  const handleSubmit = async (e) => {
		e.preventDefault();

		const mailerror = validateEmail(email.value.trim())

		email.setError(mailerror);

		if (mailerror) {
			return ;
		}
		const apiCall = () => ForgotPassword(email.value.trim());

		try {
			const response = await submit(apiCall);
			console.log('Link sent with Success : ', response)
		} catch (error) {
			console.error("Submission failed, error shown to user.");
		}
	};

  return (
    <>
      <img className="w-12" src={PingoSad}></img>
      <div className="m-3">
        <p className="font-bebas-neue text-h4">Forgot your password?</p>
        <p className="text-h5body">Enter the email linked to your account and we’ll send you reset instructions.</p>
      </div>
      {submissionError && (<span className={isSuccess ? 'submission-success' : 'submission-error'}> {submissionError} </span>)}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-4/5">
        <div className={`flex flex-col gap-0 rounded-lg ${email.error ? "bg-red/15" : ""}`}>
          <EmailField
          onChange={email.onChange}
          onBlur={email.onBlur}
          value={email.value}
          error={email.error}
          />
          {email.error && <span className='error-span' > {email.error}</span>}
			  </div>
		<Input
		type="submit"
		name="submit"
		value="Send Reset Link"
    error={email.error}
    isLoading={false}
		/>
		<div className="flex flex-row items-center justify-evenly">
			<hr className="w-1/3 border-bgsecondary" />
			<p className="text-h6body">or</p>
			<hr className="w-1/3 border-bgsecondary" />
		</div>
        <div className="flex flex-row flex-wrap mb-5 justify-evenly font-bebas-neue">
          <Link to="/signin" className="w-full secondary-button">
          sign in
          </Link>
        </div>
      </form>
    </>
  )
}

export default PasswordLost
