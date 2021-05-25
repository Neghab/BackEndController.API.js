import logging
import os
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey

from py_cipher_tool.decrypt import decrypt_RSA_PKCS1v1_5_ciphertext
from py_cipher_tool.key_management import load_rsa_private_key_from_cert

logger = logging.getLogger(__name__)

__author__ = 'kclark'


def decrypt_secrets_config_values(encrypted_secrets_config: dict, deployed_env_flag: bool) -> dict:
    try:
        private_key = _compute_decryption_private_key()
        result = {key: decrypt_RSA_PKCS1v1_5_ciphertext(private_key, value)
                  for key, value in encrypted_secrets_config.items()}
    except Exception:
        logger.critical('Error decrypting secrets configuration')
        result = {}

        # Only raise exception in deployed environment context
        if deployed_env_flag:
            raise

    return result


def _compute_decryption_private_key() -> RSAPrivateKey:
    try:
        root_dir = Path(os.path.abspath(__file__)).parents[1]
        local_cert_file_path = os.path.join(root_dir, 'utils/certs/cert-private.pem')
        cert_file_path = os.getenv('INTERNAL_ENCRYPTION_CERT_FILE_PATH', local_cert_file_path)

        result = load_rsa_private_key_from_cert(cert_file_path)
    except FileNotFoundError:
        logger.exception('Error loading rsa private key from cert - file not found')
        raise
    except Exception:
        logger.exception('Error loading rsa private key from cert')
        raise

    return result
