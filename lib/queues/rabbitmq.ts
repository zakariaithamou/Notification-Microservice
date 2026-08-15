import amqp from "amqplib";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
export const QUEUE_NAME = "email_queue";

let connection: amqp.ChannelModel | null = null;
let channel: amqp.Channel | null = null;

export const getRabbitMQChannel = async () => {
  if (channel) return channel;

  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });

    console.log(" Connected to RabbitMQ");
    return channel;
  } catch (error) {
    console.error("RabbitMQ Connection Error:", error);
    throw error;
  }
};

export interface QueuePayload {
  notificationId: string;
  from?: string;
}

export const publishToQueue = async (payload: QueuePayload) => {
  const ch = await getRabbitMQChannel();
  ch.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  });
};
