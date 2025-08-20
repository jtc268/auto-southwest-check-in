FROM python:3.11-slim

WORKDIR /app

# Define so the script knows not to download a new driver version, as
# this Docker image already downloads a compatible chromedriver
ENV AUTO_SOUTHWEST_CHECK_IN_DOCKER 1

# Install Chrome and dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements.txt
RUN pip3 install --upgrade pip && pip3 install --no-cache-dir -r requirements.txt

# Manually copy the driver to the correct locations. There is currently not a chromedriver
# that works with Linux ARM, so it needs to be downloaded through apt and copied over. The
# Python directory needs to be updated every time the Python image is updated.
RUN cp /usr/bin/chromedriver /usr/local/lib/python3.11/site-packages/seleniumbase/drivers/chromedriver
RUN cp /usr/bin/chromedriver /usr/local/lib/python3.11/site-packages/seleniumbase/drivers/uc_driver

COPY . .

ENTRYPOINT ["python3", "-u", "southwest.py"]
