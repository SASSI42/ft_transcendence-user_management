import Input from './input'
import { FiMail } from 'react-icons/fi'

const EmailField = ({
	className = '',
	value,
	onChange,
	onBlur,
	error,
	placeHolder = 'example@mail.com'
}) => {

	return (<Input
		className={className}
		icon={<FiMail size={18} />}
		type="mail"
		name="mail"
		placeholder = {placeHolder}
		value={value}
		onChange={onChange}
		onBlur={onBlur}
		error={error}
		/>)

}

export default EmailField;